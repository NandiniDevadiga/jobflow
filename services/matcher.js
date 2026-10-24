/**
 * AI & Keyword Job Matcher and Auto-Cover Letter Generator
 */

function calculateJobMatch(userProfile, job) {
  if (!userProfile || !job) {
    return { matchPercentage: 70, matchedSkills: [], missingSkills: [], recommendation: 'Good Match' };
  }

  const userSkills = (userProfile.skills || []).map(s => s.toLowerCase());
  const jobText = `${job.title} ${job.description} ${(job.tags || []).join(' ')}`.toLowerCase();

  const matchedSkills = [];
  const missingSkills = [];

  // Common tech and data analytics skills to check
  const popularKeywords = [
    'python', 'r', 'sql', 'power bi', 'dax', 'power query', 'pandas', 'numpy',
    'knime', 'scikit-learn', 'machine learning', 'excel', 'data modeling',
    'star schema', 'kpi dashboards', 'business intelligence', 'statistical analysis',
    'data visualization', 'tableau', 'etl', 'data warehouse', 'aws'
  ];

  // 1. Skill overlap
  userSkills.forEach(skill => {
    if (jobText.includes(skill)) {
      matchedSkills.push(skill.toUpperCase().replace(/\b\w/g, l => l.toUpperCase()));
    }
  });

  popularKeywords.forEach(kw => {
    if (jobText.includes(kw) && !userSkills.includes(kw)) {
      missingSkills.push(kw.toUpperCase().replace(/\b\w/g, l => l.toUpperCase()));
    }
  });

  // 2. Title alignment score
  let titleScore = 20;
  const targetRoles = (userProfile.preferences?.targetRoles || []).map(r => r.toLowerCase());
  const jobTitleLower = job.title.toLowerCase();

  if (targetRoles.some(role => jobTitleLower.includes(role) || role.includes(jobTitleLower) || jobTitleLower.includes('data') || jobTitleLower.includes('analyst') || jobTitleLower.includes('bi'))) {
    titleScore = 35;
  }

  // 3. Experience alignment bonus/penalty
  let expScore = 0;
  const jobExpLower = (job.experience || '').toLowerCase();
  const userExp = userProfile.personal?.yearsOfExperience || 0.5;

  if (userExp <= 1.5) {
    // Candidate is a Fresher / Emerging Professional
    if (jobExpLower.includes('fresher') || jobExpLower.includes('0 -') || jobExpLower.includes('graduate') || jobExpLower.includes('entry') || jobExpLower.includes('intern') || jobExpLower.includes('junior')) {
      expScore = 15; // Strong boost for matching entry-level
    } else if (jobExpLower.includes('3 -') || jobExpLower.includes('4 -') || jobExpLower.includes('5+') || jobExpLower.includes('senior') || jobExpLower.includes('lead')) {
      expScore = -25; // Penalty for senior roles
    }
  }

  // 4. Overall calculation
  const skillRatio = userSkills.length > 0 ? (matchedSkills.length / Math.min(userSkills.length, 6)) : 0.5;
  const rawScore = Math.round((skillRatio * 45) + titleScore + expScore + 10);
  const matchPercentage = Math.min(Math.max(rawScore, 50), 98);

  let recommendation = 'Good Match';
  if (matchPercentage >= 85) recommendation = '🔥 High Match - Priority Apply!';
  else if (matchPercentage >= 75) recommendation = '✨ Strong Match';
  else recommendation = '⚖️ Moderate Match';

  return {
    matchPercentage,
    matchedSkills: [...new Set(matchedSkills)].slice(0, 8),
    missingSkills: [...new Set(missingSkills)].slice(0, 4),
    recommendation
  };
}

/**
 * Generate customized, tailored cover letter
 */
function generateCoverLetter(userProfile, job) {
  const name = userProfile.personal?.fullName || 'Nandini Devadiga';
  const role = job.title || 'Data Analyst';
  const company = job.company || 'your team';
  const skills = (userProfile.skills || ['Python', 'SQL', 'Power BI', 'DAX', 'Pandas']).slice(0, 5).join(', ');
  const phone = userProfile.personal?.phone || '+91 9372568518';
  const email = userProfile.personal?.email || 'nandiniddd16@gmail.com';

  return `Dear Hiring Team at ${company},

I am writing to express my strong interest in the ${role} position. Having completed my Master of Science in Data Science & Artificial Intelligence from Middlesex University Dubai and currently working as a Data Analyst at Vastu Housing Finance (with previous internship experience at HDFC AMC), I specialize in transforming raw datasets into actionable executive intelligence through ${skills}.

In my analytical roles, I engineered centralized Power BI dashboards accessed by executive leadership, formulated 10+ custom DAX measures for spend and CAGR analysis, and automated SQL workflows in KNIME to eliminate manual reporting. My technical project repertoire includes predictive machine learning classification models in Python and global health trend analytics across 200 countries.

Key capabilities I bring to ${company}:
• End-to-end Power BI dashboard architecture with dynamic parameters, star schema data modeling, and interactive navigation hubs.
• Fluent data preprocessing and statistical analysis in SQL and Python (Pandas, NumPy, scikit-learn).
• Strong academic foundation in Data Science & AI paired with practical production experience and a proactive, problem-solving mindset.

Thank you for your consideration. I look forward to discussing how my analytical skills and dedication can support ${company}'s objectives.

Sincerely,
${name}
Email: ${email}
Phone: ${phone}
Education: MSc in Data Science & AI (Degree Completed)
LinkedIn: ${userProfile.personal?.linkedIn || 'https://www.linkedin.com/in/nandini-deepa'}
GitHub: ${userProfile.personal?.github || 'https://github.com/NandiniDevadiga'}`;
}

/**
 * Generate smart answers for common screening questions (No visa info)
 */
function generateScreeningAnswers(userProfile, job) {
  const p = userProfile.personal || {};
  return {
    whyWorkHere: `I admire ${job.company}'s data-driven innovation and culture. The ${job.title} role directly aligns with my hands-on background in Power BI dashboard engineering, custom DAX measures, and Python/SQL analytics.`,
    noticePeriod: `${p.noticePeriodDays || 30} days (Standard 30 Days Notice / Negotiable)`,
    currentSalary: `${p.currentCtcLakhs || 4.8} LPA`,
    expectedSalary: `5 to 6 LPA (Flexible / Open to discussion based on standard industry benchmarks)`,
    currentLocation: p.location || 'Mumbai, India',
    highestEducation: 'Master of Science in Data Science and Artificial Intelligence (Middlesex University Dubai | Degree Completed, awaiting degree certificate)',
    relevantExperienceYears: 'Data Analyst at Vastu Housing Finance (6 months) + internship at HDFC AMC + MSc in Data Science & AI.'
  };
}

/**
 * Generate job-tailored resume summary and ATS keyword bullets
 */
function generateTailoredResume(userProfile, job) {
  const role = job.title || 'Data Analyst';
  const company = job.company || 'Enterprise';
  const match = calculateJobMatch(userProfile, job);
  const matched = (match.matchedSkills && match.matchedSkills.length > 0) ? match.matchedSkills : ['Power BI', 'SQL', 'DAX', 'Python', 'Excel', 'Data Modeling'];

  return {
    targetHeadline: `${role} | MSc Data Science & AI | Power BI, SQL, Python, DAX`,
    professionalSummary: `Results-driven Data Analyst with an MSc in Data Science & Artificial Intelligence (Middlesex University Dubai) and hands-on experience at Vastu Housing Finance and HDFC AMC. Specialized in end-to-end Power BI dashboard engineering, custom DAX metrics, SQL query optimization, and predictive modeling in Python, tailored specifically for high-impact decision support at ${company}.`,
    topKeywordsToInclude: matched,
    tailoredBullets: [
      `Designed and deployed centralized Power BI executive dashboards utilizing Star Schema architecture, dynamic slicers, and 10+ custom DAX measures for KPI performance tracking.`,
      `Automated SQL data transformation workflows and ETL pipelines in KNIME, eliminating manual spreadsheet overhead and accelerating reporting turnaround by 40%.`,
      `Executed exploratory data analysis and predictive modeling using Python (Pandas, NumPy, scikit-learn), extracting actionable trends from complex multi-source datasets.`
    ]
  };
}

module.exports = {
  calculateJobMatch,
  generateCoverLetter,
  generateScreeningAnswers,
  generateTailoredResume
};
