const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

/**
 * Intelligent Form Auto-filler using Playwright
 */
async function launchBrowserAssistant({ jobUrl, userProfile, resumePath = null, headless = false, onLog = console.log }) {
  let browser = null;
  const logs = [];

  const log = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    const formatted = `[${timestamp}] ${msg}`;
    logs.push(formatted);
    if (onLog) onLog(formatted);
  };

  try {
    log(`Initializing Playwright browser agent...`);
    
    // Launch browser with fallback support for both Windows and Cloud Linux
    let browserOptions = {
      headless: headless || process.env.HEADLESS === 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
    };

    if (process.platform === 'win32' && !headless) {
      browserOptions.channel = 'msedge';
      browserOptions.args.push('--start-maximized');
    }

    try {
      browser = await chromium.launch(browserOptions);
    } catch (launchErr) {
      log(`Primary browser launch notice (${launchErr.message}). Retrying standard headless chromium...`);
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
      });
    }

    const context = await browser.newContext({
      viewport: null, // Full screen
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0'
    });

    const page = await context.newPage();
    log(`Navigating to target job URL: ${jobUrl}`);

    await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    log(`Page loaded successfully. Scanning DOM for application inputs...`);

    // Give page a moment to render dynamic forms
    await page.waitForTimeout(2000);

    const personal = userProfile.personal || {};
    const fullName = personal.fullName || '';
    const names = fullName.split(' ');
    const firstName = names[0] || '';
    const lastName = names.slice(1).join(' ') || firstName;
    const email = personal.email || '';
    const phone = personal.phone || '';
    const linkedin = personal.linkedIn || '';
    const github = personal.github || '';
    const portfolio = personal.portfolio || '';
    const location = personal.location || '';
    const currentCompany = personal.currentCompany || '';
    const currentTitle = personal.currentTitle || '';

    let fieldsFilled = 0;

    // Helper: Fill input if selector exists
    const tryFill = async (selectors, value, labelName) => {
      if (!value) return;
      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (el && await el.isVisible()) {
            const currentVal = await el.inputValue().catch(() => '');
            if (!currentVal) {
              await el.fill(value);
              log(`✓ Auto-filled ${labelName}`);
              fieldsFilled++;
              return true;
            }
          }
        } catch (e) {}
      }
      return false;
    };

    // 1. Full Name / First Name / Last Name
    await tryFill([
      'input[name="name" i]',
      'input[id*="name" i]:not([id*="first"]):not([id*="last"])',
      'input[autocomplete="name"]',
      'input[placeholder*="full name" i]'
    ], fullName, 'Full Name');

    await tryFill([
      'input[name*="first_name" i]',
      'input[name*="firstname" i]',
      'input[id*="first_name" i]',
      'input[id*="firstname" i]',
      'input[placeholder*="first name" i]'
    ], firstName, 'First Name');

    await tryFill([
      'input[name*="last_name" i]',
      'input[name*="lastname" i]',
      'input[id*="last_name" i]',
      'input[id*="lastname" i]',
      'input[placeholder*="last name" i]'
    ], lastName, 'Last Name');

    // 2. Email
    await tryFill([
      'input[type="email"]',
      'input[name*="email" i]',
      'input[id*="email" i]',
      'input[autocomplete="email"]'
    ], email, 'Email Address');

    // 3. Phone
    await tryFill([
      'input[type="tel"]',
      'input[name*="phone" i]',
      'input[id*="phone" i]',
      'input[name*="mobile" i]',
      'input[placeholder*="phone" i]'
    ], phone, 'Phone Number');

    // 4. LinkedIn & Social URLs
    await tryFill([
      'input[name*="linkedin" i]',
      'input[id*="linkedin" i]',
      'input[placeholder*="linkedin" i]'
    ], linkedin, 'LinkedIn Profile');

    await tryFill([
      'input[name*="github" i]',
      'input[id*="github" i]',
      'input[placeholder*="github" i]'
    ], github, 'GitHub Profile');

    await tryFill([
      'input[name*="portfolio" i]',
      'input[name*="website" i]',
      'input[id*="portfolio" i]',
      'input[id*="website" i]'
    ], portfolio, 'Portfolio Website');

    // 5. Current Company & Title
    await tryFill([
      'input[name*="org" i]',
      'input[name*="company" i]',
      'input[id*="company" i]'
    ], currentCompany, 'Current Company');

    await tryFill([
      'input[name*="title" i]',
      'input[id*="title" i]',
      'input[name*="role" i]'
    ], currentTitle, 'Current Job Title');

    // 6. Location
    await tryFill([
      'input[name*="location" i]',
      'input[id*="location" i]',
      'input[name*="city" i]',
      'input[placeholder*="location" i]'
    ], location, 'Current Location');

    // 7. Resume upload if path exists
    if (resumePath && fs.existsSync(resumePath)) {
      try {
        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.setInputFiles(resumePath);
          log(`✓ Uploaded resume file (${path.basename(resumePath)})`);
          fieldsFilled++;
        }
      } catch (err) {
        log(`Notice: Resume file upload skipped (${err.message})`);
      }
    }

    log(`🎉 Auto-fill completed! Filled ${fieldsFilled} fields.`);
    log(`[Mode: Review & Assist] The window remains active so you can inspect, review, and finalize submission.`);

    return {
      success: true,
      fieldsFilled,
      logs
    };
  } catch (error) {
    log(`[Error] Automation error: ${error.message}`);
    return {
      success: false,
      error: error.message,
      logs
    };
  }
}

module.exports = {
  launchBrowserAssistant
};
