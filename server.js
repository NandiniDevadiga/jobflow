const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { searchAllJobs } = require('./services/jobScraper');
const { calculateJobMatch, generateCoverLetter, generateScreeningAnswers, generateTailoredResume } = require('./services/matcher');
const { launchBrowserAssistant } = require('./services/automation');
const { sendJobDigestEmail, initScheduler } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Paths
const DATA_DIR = path.join(__dirname, 'data');
const PROFILE_FILE = path.join(DATA_DIR, 'profile.json');
const APPLICATIONS_FILE = path.join(DATA_DIR, 'applications.json');

// Helper to read JSON
function readJson(filePath, defaultVal = {}) {
  try {
    if (!fs.existsSync(filePath)) return defaultVal;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return defaultVal;
  }
}

// Helper to write JSON
function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// In-memory cache for fast repeat searches
let cachedJobs = [];

/* ---------------- API ROUTES ---------------- */

// 1. Profile Endpoints
app.get('/api/profile', (req, res) => {
  const profile = readJson(PROFILE_FILE, {});
  res.json(profile);
});

app.post('/api/profile', (req, res) => {
  try {
    const updated = req.body;
    writeJson(PROFILE_FILE, updated);
    res.json({ success: true, message: 'Profile updated successfully', profile: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Search Jobs across all platforms with strict location & experience filters
app.get('/api/jobs/search', async (req, res) => {
  try {
    const query = req.query.query || 'Data Analyst';
    const location = req.query.location || 'Mumbai';
    const experienceLevel = req.query.experienceLevel || 'fresher';
    const allowRemote = req.query.allowRemote === 'true';
    const platforms = req.query.platforms ? req.query.platforms.split(',') : ['linkedin', 'naukri', 'indeed', 'company'];
    
    const profile = readJson(PROFILE_FILE, {});
    const rapidApiKey = profile.apiKeys?.rapidApiKey || '';

    const rawJobs = await searchAllJobs({ query, location, experienceLevel, allowRemote, platforms, rapidApiKey });

    // Enrich with AI match score
    const enrichedJobs = rawJobs.map(job => {
      const match = calculateJobMatch(profile, job);
      return {
        ...job,
        matchScore: match.matchPercentage,
        matchedSkills: match.matchedSkills,
        missingSkills: match.missingSkills,
        recommendation: match.recommendation
      };
    });

    // Sort by highest match score
    enrichedJobs.sort((a, b) => b.matchScore - a.matchScore);
    cachedJobs = enrichedJobs;

    res.json({
      success: true,
      count: enrichedJobs.length,
      jobs: enrichedJobs
    });
  } catch (err) {
    console.error('Job search API error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Generate Cover Letter & Screening Responses
app.post('/api/jobs/tailor', (req, res) => {
  try {
    const { job } = req.body;
    const profile = readJson(PROFILE_FILE, {});
    
    if (!job) {
      return res.status(400).json({ success: false, error: 'Job details required' });
    }

    const coverLetter = generateCoverLetter(profile, job);
    const screeningAnswers = generateScreeningAnswers(profile, job);
    const tailoredResume = generateTailoredResume(profile, job);
    const matchAnalysis = calculateJobMatch(profile, job);

    res.json({
      success: true,
      coverLetter,
      screeningAnswers,
      tailoredResume,
      matchAnalysis
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Playwright Browser Auto-fill & Application Assistant
app.post('/api/apply/launch-assistant', async (req, res) => {
  try {
    const { jobUrl, headless = false } = req.body;
    if (!jobUrl) {
      return res.status(400).json({ success: false, error: 'Job URL required' });
    }

    const profile = readJson(PROFILE_FILE, {});
    
    // Check if resume file exists in uploads or data
    const resumePath = path.join(__dirname, 'data', 'resume.pdf');
    const hasResume = fs.existsSync(resumePath);

    const result = await launchBrowserAssistant({
      jobUrl,
      userProfile: profile,
      resumePath: hasResume ? resumePath : null,
      headless: Boolean(headless)
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Tracked Applications (Kanban)
app.get('/api/applications', (req, res) => {
  const apps = readJson(APPLICATIONS_FILE, []);
  res.json(apps);
});

app.post('/api/applications', (req, res) => {
  try {
    const apps = readJson(APPLICATIONS_FILE, []);
    const newApp = {
      id: req.body.id || `app_${Date.now()}`,
      jobId: req.body.jobId || '',
      title: req.body.title || 'Untitled Role',
      company: req.body.company || 'Unknown Company',
      platform: req.body.platform || 'Direct',
      location: req.body.location || '',
      appliedDate: req.body.appliedDate || new Date().toISOString().split('T')[0],
      status: req.body.status || 'Applied', // Found, Applied, Interview, Offer, Rejected
      directUrl: req.body.directUrl || '',
      notes: req.body.notes || ''
    };

    const existingIdx = apps.findIndex(a => a.id === newApp.id);
    if (existingIdx >= 0) {
      apps[existingIdx] = { ...apps[existingIdx], ...newApp };
    } else {
      apps.unshift(newApp);
    }

    writeJson(APPLICATIONS_FILE, apps);
    res.json({ success: true, application: newApp, applications: apps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/applications/:id', (req, res) => {
  try {
    let apps = readJson(APPLICATIONS_FILE, []);
    apps = apps.filter(a => a.id !== req.params.id);
    writeJson(APPLICATIONS_FILE, apps);
    res.json({ success: true, applications: apps });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Daily Email Digest & Alerts
app.post('/api/email/test', async (req, res) => {
  try {
    const profile = readJson(PROFILE_FILE, {});
    const recipient = req.body.recipient || profile.emailAlerts?.recipient || 'nandiniddd16@gmail.com';

    let jobs = cachedJobs;
    if (!jobs || jobs.length === 0) {
      jobs = await searchAllJobs({
        query: 'Data Analyst',
        location: 'Mumbai, India',
        experienceLevel: 'fresher',
        userProfile: profile
      });
    }

    const result = await sendJobDigestEmail(jobs, recipient);
    res.json({ success: true, message: `Email digest generated for ${recipient}`, ...result });
  } catch (err) {
    console.error('Email send failed:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/email/settings', (req, res) => {
  try {
    const profile = readJson(PROFILE_FILE, {});
    profile.emailAlerts = {
      ...(profile.emailAlerts || {}),
      ...req.body
    };
    writeJson(PROFILE_FILE, profile);
    res.json({ success: true, message: 'Email settings saved successfully', emailAlerts: profile.emailAlerts });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 JobFlow AI Auto-Apply Hub running at: http://localhost:${PORT}`);
  console.log(`Platforms supported: LinkedIn, Naukri, Indeed, Company ATS (Greenhouse & Lever)`);
  console.log(`=======================================================`);

  // Start daily recurring cron for job alerts (9:00 AM daily)
  initScheduler(async () => {
    const profile = readJson(PROFILE_FILE, {});
    return await searchAllJobs({
      query: 'Data Analyst',
      location: 'Mumbai, India',
      experienceLevel: 'fresher',
      userProfile: profile
    });
  });
});
