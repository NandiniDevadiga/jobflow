// State
let appState = {
  activeTab: 'radar',
  profile: null,
  jobs: [],
  filteredJobs: [],
  currentFilter: 'all',
  applications: [],
  selectedJobForModal: null
};

// DOM Loaded
document.addEventListener('DOMContentLoaded', async () => {
  await loadProfile();
  await loadApplications();
  // Automatically trigger initial search tailored for Nandini (Data Analyst in Dubai / Remote / India)
  triggerInitialSearch();
});

// Switch Tabs
function switchTab(tabName) {
  appState.activeTab = tabName;
  document.querySelectorAll('.nav-tab').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

  const tabBtn = document.getElementById(`tabBtn${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  const tabPane = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);

  if (tabBtn) tabBtn.classList.add('active');
  if (tabPane) tabPane.classList.add('active');

  if (tabName === 'pipeline') {
    renderKanban();
  }
}

// Toggle Platform Pill Active Class
function togglePillClass(checkbox) {
  const pill = checkbox.closest('.platform-pill');
  if (checkbox.checked) {
    pill.classList.add('active');
  } else {
    pill.classList.remove('active');
  }
}



// Load Profile
async function loadProfile() {
  try {
    const res = await fetch('/api/profile');
    const profile = await res.json();
    appState.profile = profile;

    // Populate inputs in Profile Tab
    if (profile.personal) {
      document.getElementById('profFullName').value = profile.personal.fullName || '';
      document.getElementById('profEmail').value = profile.personal.email || '';
      document.getElementById('profPhone').value = profile.personal.phone || '';
      document.getElementById('profLocation').value = profile.personal.location || '';
      document.getElementById('profLinkedIn').value = profile.personal.linkedIn || '';
      document.getElementById('profGithub').value = profile.personal.github || '';
      document.getElementById('profPortfolio').value = profile.personal.portfolio || '';
      document.getElementById('profNotice').value = profile.personal.noticePeriodDays || '';
      document.getElementById('profCompany').value = profile.personal.currentCompany || '';
      document.getElementById('profTitle').value = profile.personal.currentTitle || '';
      document.getElementById('profExpYears').value = profile.personal.yearsOfExperience || '';
      document.getElementById('profExpectedCtc').value = profile.personal.expectedCtcLakhs || '';
    }

    if (profile.education && document.getElementById('profEducation')) {
      document.getElementById('profEducation').value = profile.education;
    }

    if (profile.certifications && document.getElementById('profCertifications')) {
      document.getElementById('profCertifications').value = Array.isArray(profile.certifications) ? profile.certifications.join(', ') : profile.certifications;
    }

    if (profile.skills) {
      document.getElementById('profSkills').value = profile.skills.join(', ');
    }

    if (profile.experienceSummary) {
      document.getElementById('profSummary').value = profile.experienceSummary;
    }

    if (profile.apiKeys) {
      document.getElementById('cfgRapidApiKey').value = profile.apiKeys.rapidApiKey || '';
    }

    if (profile.emailAlerts) {
      if (document.getElementById('cfgEmailRecipient')) {
        document.getElementById('cfgEmailRecipient').value = profile.emailAlerts.recipient || 'nandiniddd16@gmail.com';
      }
      if (document.getElementById('cfgEmailEnabled')) {
        document.getElementById('cfgEmailEnabled').checked = profile.emailAlerts.enabled !== false;
      }
    }

    // Default search inputs from preferences if available
    if (profile.preferences) {
      if (profile.preferences.targetRoles && profile.preferences.targetRoles.length > 0) {
        document.getElementById('searchQuery').value = profile.preferences.targetRoles[0];
      }
      if (profile.preferences.targetLocations && profile.preferences.targetLocations.length > 0) {
        document.getElementById('searchLocation').value = profile.preferences.targetLocations[0];
      }
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
  }
}

// Save Profile
async function saveProfile() {
  try {
    const skillsRaw = document.getElementById('profSkills').value;
    const skillsArray = skillsRaw.split(',').map(s => s.trim()).filter(Boolean);

    const certsRaw = document.getElementById('profCertifications')?.value || '';
    const certsArray = certsRaw.split(',').map(s => s.trim()).filter(Boolean);

    const updated = {
      personal: {
        fullName: document.getElementById('profFullName').value,
        email: document.getElementById('profEmail').value,
        phone: document.getElementById('profPhone').value,
        location: document.getElementById('profLocation').value,
        linkedIn: document.getElementById('profLinkedIn').value,
        github: document.getElementById('profGithub').value,
        portfolio: document.getElementById('profPortfolio').value,
        noticePeriodDays: Number(document.getElementById('profNotice').value) || 15,
        currentCompany: document.getElementById('profCompany').value,
        currentTitle: document.getElementById('profTitle').value,
        yearsOfExperience: Number(document.getElementById('profExpYears').value) || 0.5,
        expectedCtcLakhs: document.getElementById('profExpectedCtc').value || '9 LPA'
      },
      skills: skillsArray,
      education: document.getElementById('profEducation')?.value || '',
      certifications: certsArray,
      experienceSummary: document.getElementById('profSummary').value,
      apiKeys: {
        rapidApiKey: document.getElementById('cfgRapidApiKey').value.trim()
      },
      emailAlerts: {
        enabled: document.getElementById('cfgEmailEnabled')?.checked ?? true,
        recipient: document.getElementById('cfgEmailRecipient')?.value.trim() || 'nandiniddd16@gmail.com',
        scheduleHour: 9,
        scheduleMinute: 0
      },
      preferences: appState.profile?.preferences || {
        targetRoles: ['Data Analyst', 'BI Analyst'],
        targetLocations: ['Mumbai, India', 'Netherlands', 'Singapore', 'Spain', 'Italy', 'Germany', 'Dubai, UAE', 'Remote Worldwide'],
        experienceLevel: 'fresher'
      }
    };

    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });

    const data = await res.json();
    if (data.success) {
      appState.profile = updated;
      showToast('Profile, skills & international preferences saved successfully!');
    }
  } catch (err) {
    showToast('Failed to save profile: ' + err.message);
  }
}

// Quick Foreign / Local Destination Click Handler
function setQuickLocation(locationName, roleName = 'Data Analyst') {
  document.getElementById('searchLocation').value = locationName;
  if (roleName) document.getElementById('searchQuery').value = roleName;

  document.querySelectorAll('.preset-chip').forEach(c => c.classList.remove('active'));
  if (window.event && window.event.target && window.event.target.classList) {
    window.event.target.classList.add('active');
  }

  // If selecting a specific city like Mumbai, keep strict local focus
  const chkRemote = document.getElementById('chkAllowRemote');
  if (chkRemote) {
    chkRemote.checked = locationName.toLowerCase().includes('remote');
  }

  showToast(`Searching openings in ${locationName}...`);
  handleSearch(new Event('submit'));
}

// Initial Search
function triggerInitialSearch() {
  handleSearch(new Event('submit'));
}

// Handle Search
async function handleSearch(e) {
  if (e && e.preventDefault) e.preventDefault();

  const query = document.getElementById('searchQuery').value.trim();
  const location = document.getElementById('searchLocation').value.trim();
  const experienceLevel = document.getElementById('searchExperience')?.value || 'fresher';
  const allowRemote = document.getElementById('chkAllowRemote')?.checked ? 'true' : 'false';

  // Platforms
  const platforms = [];
  if (document.getElementById('chkLinkedIn').checked) platforms.push('linkedin');
  if (document.getElementById('chkNaukri').checked) platforms.push('naukri');
  if (document.getElementById('chkIndeed').checked) platforms.push('indeed');
  if (document.getElementById('chkCompany').checked) platforms.push('company');

  if (platforms.length === 0) {
    showToast('Please select at least one portal!');
    return;
  }

  // UI loading
  const spinner = document.getElementById('searchSpinner');
  const btnText = document.getElementById('searchText');
  const searchBtn = document.getElementById('searchBtn');

  spinner.style.display = 'inline-block';
  btnText.textContent = 'Scanning Openings...';
  searchBtn.disabled = true;

  try {
    const url = `/api/jobs/search?query=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}&experienceLevel=${encodeURIComponent(experienceLevel)}&allowRemote=${allowRemote}&platforms=${platforms.join(',')}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.jobs) {
      appState.jobs = data.jobs;
      updateStats();
      filterJobs(appState.currentFilter);
      showToast(`Found ${data.jobs.length} verified jobs strictly in ${location}!`);
    } else {
      showToast('No jobs returned or an error occurred.');
    }
  } catch (err) {
    showToast('Search failed: ' + err.message);
  } finally {
    spinner.style.display = 'none';
    btnText.textContent = '⚡ Scan & Match Jobs';
    searchBtn.disabled = false;
  }
}

// Helper: Check if a job is foreign / international
function isForeignJob(job) {
  const loc = (job.location || '').toLowerCase();
  const tags = (job.tags || []).join(' ').toLowerCase();
  return (
    loc.includes('dubai') ||
    loc.includes('uae') ||
    loc.includes('united arab emirates') ||
    loc.includes('gulf') ||
    loc.includes('uk') ||
    loc.includes('london') ||
    loc.includes('united states') ||
    loc.includes('remote') ||
    tags.includes('🇦🇪') ||
    tags.includes('🇬🇧') ||
    tags.includes('🌐') ||
    tags.includes('global') ||
    tags.includes('tax-free')
  );
}

// Update Counts & Stats
function updateStats() {
  const all = appState.jobs;
  const highMatch = all.filter(j => j.matchScore >= 80);
  const foreignJobs = all.filter(isForeignJob);
  const li = all.filter(j => j.platformCode === 'linkedin');
  const nk = all.filter(j => j.platformCode === 'naukri');
  const ind = all.filter(j => j.platformCode === 'indeed');
  const co = all.filter(j => j.platformCode === 'greenhouse' || j.platformCode === 'lever');

  document.getElementById('statFound').textContent = all.length;
  document.getElementById('statHighMatch').textContent = highMatch.length;

  document.getElementById('countAll').textContent = all.length;
  if (document.getElementById('countForeign')) {
    document.getElementById('countForeign').textContent = foreignJobs.length;
  }
  document.getElementById('countHighMatch').textContent = highMatch.length;
  document.getElementById('countLinkedIn').textContent = li.length;
  document.getElementById('countNaukri').textContent = nk.length;
  document.getElementById('countIndeed').textContent = ind.length;
  document.getElementById('countCompany').textContent = co.length;
}

// Filter Jobs
function filterJobs(filter) {
  appState.currentFilter = filter;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));

  const chipMap = {
    'all': 0, 'foreign': 1, 'high-match': 2, 'company': 3, 'linkedin': 4, 'naukri': 5, 'indeed': 6
  };
  const chips = document.querySelectorAll('.filter-chip');
  if (chips[chipMap[filter]]) chips[chipMap[filter]].classList.add('active');

  if (filter === 'all') {
    appState.filteredJobs = [...appState.jobs];
  } else if (filter === 'foreign') {
    appState.filteredJobs = appState.jobs.filter(isForeignJob);
  } else if (filter === 'high-match') {
    appState.filteredJobs = appState.jobs.filter(j => j.matchScore >= 80);
  } else if (filter === 'company') {
    appState.filteredJobs = appState.jobs.filter(j => j.platformCode === 'greenhouse' || j.platformCode === 'lever');
  } else {
    appState.filteredJobs = appState.jobs.filter(j => j.platformCode === filter);
  }

  renderJobs();
}

// Render Jobs
function renderJobs() {
  const container = document.getElementById('jobStreamGrid');
  const sort = document.getElementById('sortOrder').value;

  let list = [...appState.filteredJobs];
  if (sort === 'matchDesc') {
    list.sort((a, b) => b.matchScore - a.matchScore);
  }

  if (list.length === 0) {
    container.innerHTML = `
      <div class="empty-state-card">
        <div class="empty-icon">🔍</div>
        <h3>No matching jobs found in this category</h3>
        <p>Try switching to another destination preset or clearing filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(job => {
    let platformClass = 'tag-company';
    if (job.platformCode === 'linkedin') platformClass = 'tag-linkedin';
    if (job.platformCode === 'naukri') platformClass = 'tag-naukri';
    if (job.platformCode === 'indeed') platformClass = 'tag-indeed';

    const matchedTags = (job.matchedSkills || []).slice(0, 5).map(s => `<span class="skill-tag matched">✓ ${s}</span>`).join('');
    const missingTags = (job.missingSkills || []).slice(0, 2).map(s => `<span class="skill-tag missing">+ ${s}</span>`).join('');

    const isAlreadyTracked = appState.applications.some(a => a.directUrl === job.directUrl || a.title === job.title);
    const foreignBadge = isForeignJob(job) ? `<span style="font-size:0.75rem; background:rgba(56,189,248,0.18); color:#38bdf8; border:1px solid rgba(56,189,248,0.3); padding:0.15rem 0.5rem; border-radius:12px; margin-left:0.4rem;">🌍 Global</span>` : '';

    return `
      <div class="job-card">
        <div>
          <div class="job-card-top">
            <div>
              <span class="job-platform-tag ${platformClass}">
                ${escapeHtml(job.platform)}
              </span>
              ${foreignBadge}
            </div>
            <span class="match-score-pill">
              🔥 ${job.matchScore}% Match
            </span>
          </div>

          <h3 class="job-title">${escapeHtml(job.title)}</h3>
          <div class="job-company">${escapeHtml(job.company)}</div>

          <div class="job-meta-row">
            <span class="meta-item">📍 ${escapeHtml(job.location)}</span>
            <span class="meta-item">💼 ${escapeHtml(job.experience)}</span>
            <span class="meta-item">💰 ${escapeHtml(job.salary)}</span>
            <span class="meta-item">🕒 ${escapeHtml(job.postedDate)}</span>
          </div>

          <p class="job-snippet">${escapeHtml(job.description)}</p>

          <div class="job-skills-bar">
            ${matchedTags}
            ${missingTags}
          </div>
        </div>

        <div class="job-actions-bar">
          <button class="btn btn-primary" style="background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%); font-weight: 600;" onclick="downloadTailoredResumePdf('${escapeAttr(job.id)}', this)">
            📥 Tailored Resume (PDF)
          </button>
          <div class="card-secondary-actions">
            <a href="${escapeAttr(job.directUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" title="Open Job Application in New Tab">
              🌐 Apply on Portal
            </a>
            <button class="btn btn-secondary" title="View Tailored Cover Letter & Screening Q&A" onclick="openTailorModal('${escapeAttr(job.id)}')">
              📝 Cover Letter & Q&A
            </button>
            <button class="btn btn-secondary ${isAlreadyTracked ? 'active' : ''}" title="${isAlreadyTracked ? 'Saved in Pipeline' : 'Save to Pipeline'}" onclick="saveToPipeline('${escapeAttr(job.id)}')">
              ${isAlreadyTracked ? '✓ Saved' : '📌 Save'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 1-Tap ATS Tailored Resume PDF Generator
async function downloadTailoredResumePdf(jobId, btnElement) {
  const job = appState.jobs.find(j => j.id === jobId);
  if (!job) return;

  const originalText = btnElement ? btnElement.innerHTML : '';
  if (btnElement) {
    btnElement.disabled = true;
    btnElement.innerHTML = '⏳ Generating PDF...';
  }

  showToast(`Generating tailored ATS resume for ${job.company}...`);

  try {
    const res = await fetch('/api/jobs/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job })
    });
    const data = await res.json();
    const tailored = data.tailoredResume || {};
    const p = appState.profile?.personal || {};

    const companySafe = (job.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `Nandini_Devadiga_Resume_${companySafe}.pdf`;

    const bulletsHtml = (tailored.tailoredBullets || [
      'Designed and deployed centralized Power BI executive dashboards utilizing Star Schema architecture, dynamic slicers, and 10+ custom DAX measures for KPI performance tracking.',
      'Automated SQL data transformation workflows and ETL pipelines in KNIME, eliminating manual spreadsheet overhead and accelerating reporting turnaround by 40%.',
      'Executed exploratory data analysis and predictive modeling using Python (Pandas, NumPy, scikit-learn), extracting actionable trends from complex multi-source datasets.'
    ]).map(b => `<li style="margin-bottom: 5px; color: #1e293b; line-height: 1.45;">${escapeHtml(b)}</li>`).join('');

    const resumeHtml = `
      <div id="atsResumeDoc" style="font-family: Arial, Helvetica, sans-serif; color: #111; padding: 22px 28px; background: #fff; width: 100%; max-width: 800px; box-sizing: border-box; font-size: 10pt; line-height: 1.4;">
        <!-- Header -->
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 8px; margin-bottom: 12px;">
          <h1 style="margin: 0; font-size: 19pt; font-weight: 800; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase;">${escapeHtml(p.fullName || 'NANDINI DEVADIGA')}</h1>
          <div style="font-size: 10.5pt; color: #2563eb; font-weight: 700; margin: 4px 0;">${escapeHtml(job.title)} &bull; Data Analyst</div>
          <div style="font-size: 9pt; color: #475569; margin-top: 3px;">
            ${escapeHtml(p.location || 'Mumbai, India')} &bull; +91 9372568518 &bull; ${escapeHtml(p.email || 'nandiniddd16@gmail.com')}
          </div>
          <div style="font-size: 9pt; color: #2563eb; margin-top: 2px;">
            <a href="${escapeHtml(p.linkedIn || 'https://www.linkedin.com/in/nandini-deepa')}" style="color: #2563eb; text-decoration: none;">LinkedIn Profile</a> &bull;
            <a href="${escapeHtml(p.github || 'https://github.com/NandiniDevadiga')}" style="color: #2563eb; text-decoration: none;">GitHub Projects</a>
          </div>
        </div>

        <!-- Professional Summary -->
        <div style="margin-bottom: 11px;">
          <div style="font-size: 9.5pt; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; letter-spacing: 0.5px;">Professional Summary</div>
          <p style="margin: 0; font-size: 9pt; color: #334155; text-align: justify; line-height: 1.45;">
            ${escapeHtml(tailored.professionalSummary || 'Results-driven Data Analyst with an MSc in Data Science & Artificial Intelligence (Middlesex University Dubai) and hands-on experience at Vastu Housing Finance and HDFC AMC. Specialized in end-to-end Power BI dashboard engineering, custom DAX metrics, SQL query optimization, and predictive modeling in Python, tailored specifically for high-impact decision support.')}
          </p>
        </div>

        <!-- Technical Skills -->
        <div style="margin-bottom: 11px;">
          <div style="font-size: 9.5pt; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; letter-spacing: 0.5px;">Core Technical Competencies</div>
          <div style="font-size: 9pt; color: #334155; line-height: 1.5;">
            <strong>Data Analytics & BI:</strong> Power BI, DAX Measures, Power Query, Star Schema Data Modeling, KPI Dashboard Architecture, Tableau, Advanced Excel<br>
            <strong>Programming & Databases:</strong> Python (Pandas, NumPy, scikit-learn), SQL (PostgreSQL, MySQL), KNIME Analytics Platform, R<br>
            <strong>Analytical Focus:</strong> Statistical Analysis, Financial Expense Metrics, Predictive Machine Learning, ETL Workflow Automation
          </div>
        </div>

        <!-- Professional Experience -->
        <div style="margin-bottom: 11px;">
          <div style="font-size: 9.5pt; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; letter-spacing: 0.5px;">Professional Experience</div>
          
          <div style="margin-bottom: 8px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 9pt; color: #0f172a;">
              <span>Vastu Housing Finance &mdash; Data Analyst</span>
              <span>June 2025 &ndash; Present | Mumbai, India</span>
            </div>
            <ul style="margin: 3px 0 0 16px; padding: 0; font-size: 8.5pt;">
              ${bulletsHtml}
            </ul>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 9pt; color: #0f172a;">
              <span>HDFC Asset Management Company (HDFC AMC) &mdash; Data Science Intern</span>
              <span>Internship | Mumbai, India</span>
            </div>
            <ul style="margin: 3px 0 0 16px; padding: 0; font-size: 8.5pt;">
              <li style="margin-bottom: 3px; color: #1e293b;">Conducted exploratory trend analysis and predictive modeling on financial expense datasets in Python and SQL.</li>
              <li style="margin-bottom: 3px; color: #1e293b;">Built multi-year variance reporting models and Power BI visualization suites for operational expense analysis.</li>
            </ul>
          </div>
        </div>

        <!-- Education -->
        <div style="margin-bottom: 10px;">
          <div style="font-size: 9.5pt; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; letter-spacing: 0.5px;">Education</div>
          
          <div style="margin-bottom: 4px;">
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 9pt; color: #0f172a;">
              <span>Master of Science in Data Science & Artificial Intelligence</span>
              <span>Middlesex University Dubai</span>
            </div>
            <div style="font-size: 8.5pt; color: #475569;">Degree Completed (Awaiting Certificate) &bull; Advanced Machine Learning, Big Data Analytics, Neural Networks</div>
          </div>

          <div>
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 9pt; color: #0f172a;">
              <span>Bachelor of Technology in Electronics & Telecommunication</span>
              <span>CGPA: 8.86 / 10</span>
            </div>
            <div style="font-size: 8.5pt; color: #475569;">Thakur College of Engineering & Technology (TCET), Mumbai</div>
          </div>
        </div>

        <!-- Certifications -->
        <div>
          <div style="font-size: 9.5pt; font-weight: 800; text-transform: uppercase; color: #0f172a; border-bottom: 1px solid #cbd5e1; padding-bottom: 2px; margin-bottom: 4px; letter-spacing: 0.5px;">Key Certifications</div>
          <div style="font-size: 8.5pt; color: #334155;">
            &bull; <strong>IBM Data Science Professional Certificate</strong> &mdash; Coursera, 2025 &bull; <strong>Power BI Specialization</strong> &mdash; Coursera, 2024
          </div>
        </div>
      </div>
    `;

    const container = document.getElementById('resumePdfContainer');
    container.innerHTML = resumeHtml;
    container.style.display = 'block';

    const resumeEl = document.getElementById('atsResumeDoc');

    if (window.html2pdf) {
      const opt = {
        margin: [6, 6, 6, 6],
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(resumeEl).save();
      container.style.display = 'none';
      showToast(`✓ Downloaded ${filename}! Ready to upload.`);
      saveToPipeline(jobId, 'Saved');
    } else {
      const printWin = window.open('', '_blank');
      printWin.document.write('<html><head><title>' + filename + '</title></head><body>' + resumeHtml + '</body></html>');
      printWin.document.close();
      printWin.print();
      container.style.display = 'none';
      showToast('✓ Opened printable resume PDF!');
    }
  } catch (err) {
    showToast('Failed to generate resume PDF: ' + err.message);
  } finally {
    if (btnElement) {
      btnElement.disabled = false;
      btnElement.innerHTML = originalText || '📥 Tailored Resume (PDF)';
    }
  }
}

// 1-Click Copy Candidate Details for Fast Mobile Apply
function copyCandidateDetails() {
  const p = appState.profile?.personal || {};
  const text = [
    `Full Name: ${p.fullName || 'Nandini Devadiga'}`,
    `Email: ${p.email || 'nandiniddd16@gmail.com'}`,
    `Phone: ${p.phone || '+91 9372568518'}`,
    `Location: ${p.location || 'Mumbai, India (Open to Relocate Anywhere in India & Abroad)'}`,
    `LinkedIn: ${p.linkedIn || 'https://www.linkedin.com/in/nandini-deepa'}`,
    `GitHub: ${p.github || 'https://github.com/NandiniDevadiga'}`,
    `Current Role: ${p.currentTitle || 'Data Analyst'} at ${p.currentCompany || 'Vastu Housing Finance'}`,
    `Experience: 0.5+ years | Notice Period: 30 days (Negotiable)`,
    `Current CTC: 4.8 LPA | Expected CTC: 5 to 6 LPA (Flexible / Open)`,
    `Education: Master of Science in Data Science & AI (Middlesex University Dubai) | B.Tech EXTC (CGPA 8.86)`,
    `Key Skills: Power BI, DAX, SQL, Python (Pandas/NumPy), Star Schema, KPI Dashboards, ETL, Advanced Excel`
  ].join('\n');

  navigator.clipboard.writeText(text).then(() => {
    showToast('✓ Candidate details copied! Ready to paste into application form.');
  }).catch(() => {
    showToast('Failed to copy text.');
  });
}

// Open AI Tailor Modal
async function openTailorModal(jobId) {
  const job = appState.jobs.find(j => j.id === jobId);
  if (!job) return;

  appState.selectedJobForModal = job;

  document.getElementById('tailorModalTitle').textContent = `AI Tailored Application: ${job.title}`;
  document.getElementById('tailorModalCompany').textContent = `${job.company} • ${job.location}`;
  document.getElementById('modalMatchScore').textContent = `${job.matchScore}% Match`;
  document.getElementById('modalMatchedSkills').textContent = (job.matchedSkills || []).join(', ') || 'Power BI, SQL, Python, DAX';
  document.getElementById('modalMissingSkills').textContent = (job.missingSkills || []).join(', ') || 'None identified';

  const modal = document.getElementById('tailorModal');
  modal.style.display = 'flex';

  try {
    const res = await fetch('/api/jobs/tailor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job })
    });

    const data = await res.json();
    if (data.success) {
      document.getElementById('modalCoverLetterText').value = data.coverLetter;

      // Populate Tailored Resume ATS points
      if (data.tailoredResume) {
        const tr = data.tailoredResume;
        const kwBox = document.getElementById('modalResumeKeywordsBox');
        if (kwBox && tr.topKeywordsToInclude) {
          kwBox.innerHTML = tr.topKeywordsToInclude.map(kw => `<span class="skill-tag matched" style="font-size:0.75rem;">✓ ${escapeHtml(kw)}</span>`).join('');
        }

        const resumeFormatted = [
          `[TARGET RESUME HEADLINE]`,
          tr.targetHeadline,
          ``,
          `[TAILORED PROFESSIONAL SUMMARY]`,
          tr.professionalSummary,
          ``,
          `[ATS-MATCHED EXPERIENCE BULLETS (Ready to paste into Resume)]`,
          ...tr.tailoredBullets.map(b => `• ${b}`)
        ].join('\n');

        const resumeBulletsEl = document.getElementById('modalResumeBulletsText');
        if (resumeBulletsEl) {
          resumeBulletsEl.value = resumeFormatted;
        }
      }

      // Populate Q&A
      const qa = data.screeningAnswers || {};
      const qaGrid = document.getElementById('modalQaGrid');
      qaGrid.innerHTML = `
        <div class="qa-item">
          <div class="qa-q">Q: Why are you interested in joining ${escapeHtml(job.company)}?</div>
          <div class="qa-a">${escapeHtml(qa.whyWorkHere)}</div>
        </div>
        <div class="qa-item">
          <div class="qa-q">Q: What is your notice period and current salary?</div>
          <div class="qa-a">Notice Period: <strong>${escapeHtml(qa.noticePeriod)}</strong> &bull; Current CTC: <strong>${escapeHtml(qa.currentSalary || '4.8 LPA')}</strong></div>
        </div>
        <div class="qa-item">
          <div class="qa-q">Q: What is your expected salary / compensation?</div>
          <div class="qa-a">${escapeHtml(qa.expectedSalary)}</div>
        </div>
        <div class="qa-item">
          <div class="qa-q">Q: What is your educational & analytical background?</div>
          <div class="qa-a">${escapeHtml(qa.highestEducation || 'MSc in Data Science & Artificial Intelligence (Degree Completed, awaiting certificate)')}</div>
        </div>
      `;
    }
  } catch (e) {
    console.error('Tailor error:', e);
  }
}

function openDirectJobUrl() {
  const job = appState.selectedJobForModal || currentAssistantJob;
  if (job) {
    const url = job.directUrl || job.applyUrl;
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
  }
  showToast('Direct job link not available.');
}

// Pipeline & Kanban
async function loadApplications() {
  try {
    const res = await fetch('/api/applications');
    const apps = await res.json();
    appState.applications = apps;
    document.getElementById('pipelineCountBadge').textContent = apps.length;
    renderKanban();
  } catch (err) {
    console.error('Failed to load applications:', err);
  }
}

async function saveToPipeline(jobId, status = 'Saved') {
  const job = appState.jobs.find(j => j.id === jobId);
  if (!job) return;

  try {
    const payload = {
      jobId: job.id,
      title: job.title,
      company: job.company,
      platform: job.platform,
      location: job.location,
      status: status,
      directUrl: job.directUrl,
      notes: `Discovered with ${job.matchScore}% AI match score.`
    };

    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (data.success) {
      appState.applications = data.applications;
      document.getElementById('pipelineCountBadge').textContent = data.applications.length;
      showToast(`Added "${job.title}" to ${status} pipeline!`);
      renderJobs();
    }
  } catch (err) {
    showToast('Failed to save to pipeline: ' + err.message);
  }
}

function renderKanban() {
  const columns = {
    'Saved': document.getElementById('cardsSaved'),
    'Applied': document.getElementById('cardsApplied'),
    'Interview': document.getElementById('cardsInterview'),
    'Offer': document.getElementById('cardsOffer')
  };

  const counts = {
    'Saved': 0, 'Applied': 0, 'Interview': 0, 'Offer': 0
  };

  Object.values(columns).forEach(col => { if (col) col.innerHTML = ''; });

  appState.applications.forEach(app => {
    const colKey = app.status || 'Saved';
    const targetWrapper = columns[colKey] || columns['Saved'];
    counts[colKey] = (counts[colKey] || 0) + 1;

    if (targetWrapper) {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.draggable = true;
      card.id = `kcard_${app.id}`;
      card.innerHTML = `
        <div class="kanban-card-title">${escapeHtml(app.title)}</div>
        <div class="kanban-card-company">${escapeHtml(app.company)} • <span style="color:var(--text-muted); font-size:0.75rem;">${escapeHtml(app.platform)}</span></div>
        <div class="kanban-card-footer">
          <span>📅 ${escapeHtml(app.appliedDate || 'Recent')}</span>
          <select class="kanban-move-select" onchange="moveApplicationStatus('${escapeAttr(app.id)}', this.value)">
            <option value="Saved" ${app.status === 'Saved' ? 'selected' : ''}>Saved</option>
            <option value="Applied" ${app.status === 'Applied' ? 'selected' : ''}>Applied</option>
            <option value="Interview" ${app.status === 'Interview' ? 'selected' : ''}>Interview</option>
            <option value="Offer" ${app.status === 'Offer' ? 'selected' : ''}>Offer</option>
          </select>
        </div>
      `;
      targetWrapper.appendChild(card);
    }
  });

  document.getElementById('countColSaved').textContent = counts['Saved'] || 0;
  document.getElementById('countColApplied').textContent = counts['Applied'] || 0;
  document.getElementById('countColInterview').textContent = counts['Interview'] || 0;
  document.getElementById('countColOffer').textContent = counts['Offer'] || 0;
}

async function moveApplicationStatus(appId, newStatus) {
  const app = appState.applications.find(a => a.id === appId);
  if (!app) return;

  app.status = newStatus;
  try {
    await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app)
    });
    showToast(`Moved to ${newStatus}`);
    renderKanban();
  } catch (e) {
    showToast('Failed to update status');
  }
}

// Modal Helpers
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.style.display = 'none';
}

function closeModalOnBackdrop(event, modalId) {
  if (event.target.id === modalId) {
    closeModal(modalId);
  }
}

// Copy to Clipboard
function copyToClipboard(elementId, successMsg = 'Copied!') {
  const el = document.getElementById(elementId);
  if (el) {
    navigator.clipboard.writeText(el.value).then(() => {
      showToast(successMsg);
    });
  }
}

// Toast
function showToast(message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Utilities
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Send Test Job Digest Email
async function sendTestEmail() {
  const btn = document.getElementById('btnSendTestEmail');
  const feedback = document.getElementById('emailTestFeedback');
  const recipient = document.getElementById('cfgEmailRecipient')?.value?.trim() || 'nandiniddd16@gmail.com';

  if (btn) {
    btn.disabled = true;
    btn.innerText = '⏳ Sending Digest...';
  }
  if (feedback) {
    feedback.style.display = 'block';
    feedback.innerHTML = `<div style="color: #0284c7; padding: 10px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px;">🚀 Generating verified Data Analyst job digest for <strong>${escapeHtml(recipient)}</strong>...</div>`;
  }

  try {
    const res = await fetch('/api/email/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient })
    });
    const data = await res.json();
    if (data.success) {
      if (feedback) {
        feedback.innerHTML = `
          <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 14px; color: #166534;">
            <div style="font-weight: 700; margin-bottom: 4px; font-size: 14px;">✅ Daily Digest Email Dispatched Successfully!</div>
            <div style="font-size: 13px; color: #374151;">Delivered to: <strong>${escapeHtml(data.recipient)}</strong> (${data.jobCount || 'Top'} curated Fresher / Entry Level roles included).</div>
            ${data.previewUrl ? `<div style="margin-top: 8px;"><a href="${data.previewUrl}" target="_blank" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600;">👉 View Web Preview of Delivered Email</a></div>` : ''}
          </div>
        `;
      }
      showToast(`Daily digest sent to ${recipient}!`);
    } else {
      if (feedback) {
        feedback.innerHTML = `<div style="color: #dc2626; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">❌ Failed to send digest: ${escapeHtml(data.error || 'Server error')}</div>`;
      }
    }
  } catch (err) {
    if (feedback) {
      feedback.innerHTML = `<div style="color: #dc2626; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">❌ Connection error: ${escapeHtml(err.message)}</div>`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = '📨 Send Test Digest Now';
    }
  }
}
