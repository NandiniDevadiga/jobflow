const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const PROFILE_FILE = path.join(__dirname, '..', 'data', 'profile.json');

function readProfile() {
  try {
    if (fs.existsSync(PROFILE_FILE)) {
      return JSON.parse(fs.readFileSync(PROFILE_FILE, 'utf8'));
    }
  } catch (e) {}
  return {};
}

/**
 * Generate formatted HTML job digest email template
 */
function buildDigestHtml(recipientName, jobs, targetLocations) {
  const topJobs = jobs.slice(0, 8);
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const jobCardsHtml = topJobs.map(job => `
    <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin-bottom: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.04);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
        <span style="background: #e0f2fe; color: #0369a1; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px; text-transform: uppercase;">
          ${job.platform || 'Verified Portal'}
        </span>
        <span style="background: #dcfce7; color: #15803d; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 20px;">
          🔥 ${job.matchScore || 85}% AI Match
        </span>
      </div>
      <h3 style="margin: 0 0 4px 0; color: #0f172a; font-size: 17px; font-weight: 700;">
        ${job.title}
      </h3>
      <div style="color: #0284c7; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
        ${job.company} • <span style="color: #64748b; font-weight: 400;">📍 ${job.location}</span>
      </div>
      <div style="color: #475569; font-size: 13px; margin-bottom: 12px;">
        💼 Experience: <strong>${job.experience || 'Fresher / 0-1 Years'}</strong> | 💰 Comp: <strong>${job.salary || 'Competitive'}</strong>
      </div>
      <a href="${job.directUrl || job.applyUrl}" target="_blank" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: 600;">
        ⚡ Direct Apply & Details &rarr;
      </a>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 14px; border: 1px solid #cbd5e1; overflow: hidden;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #0284c7, #4f46e5); padding: 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: 800;">JobFlow AI — Daily Application Digest</h1>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">Curated for ${recipientName} • ${dateStr}</p>
        </div>

        <!-- Body -->
        <div style="padding: 24px; background: #f8fafc;">
          <p style="font-size: 15px; color: #334155; margin-top: 0;">
            Hello <strong>${recipientName}</strong>,<br>
            Here are your freshly verified <strong>Data Analyst & BI</strong> job openings matching your profile across <strong>${targetLocations}</strong>.
          </p>

          ${jobCardsHtml}

          <!-- Footer Action -->
          <div style="text-align: center; margin-top: 24px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">Open JobFlow AI Dashboard locally to trigger 1-click browser auto-fill:</p>
            <a href="http://localhost:3000" style="display: inline-block; background: #0f172a; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">
              🚀 Open Auto-Apply Dashboard
            </a>
          </div>
        </div>

        <div style="background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #94a3b8;">
          Sent automatically by JobFlow AI Daily Scanner to ${recipientName}
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send job digest email
 */
async function sendJobDigestEmail(jobs = [], customRecipient = null) {
  const profile = readProfile();
  const recipient = customRecipient || profile.emailAlerts?.recipient || profile.personal?.email || 'nandiniddd16@gmail.com';
  const name = profile.personal?.fullName || 'Nandini Devadiga';
  const targetLocations = (profile.preferences?.targetLocations || ['Mumbai', 'Netherlands', 'Singapore', 'Spain', 'Italy', 'Dubai']).join(', ');

  const htmlContent = buildDigestHtml(name, jobs, targetLocations);

  // Check if SMTP is configured
  const smtpUser = profile.emailAlerts?.smtpUser || process.env.SMTP_USER;
  const smtpPass = profile.emailAlerts?.smtpPass || process.env.SMTP_PASS;

  let transporter;
  let testAccountUrl = null;

  if (smtpUser && smtpPass) {
    // User provided real Gmail / Outlook SMTP
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: smtpUser, pass: smtpPass }
    });
  } else {
    // Ethereal auto-generated test SMTP for instant demonstration
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const info = await transporter.sendMail({
    from: `"JobFlow AI Copilot" <${smtpUser || 'jobflow-ai@notifications.dev'}>`,
    to: recipient,
    subject: `🎯 Daily Job Digest: ${jobs.length} Fresh Data Analyst Openings (Mumbai, Netherlands, Singapore & More)`,
    html: htmlContent
  });

  if (!smtpUser) {
    testAccountUrl = nodemailer.getTestMessageUrl(info);
  }

  console.log(`[EMAIL] Daily digest sent successfully to ${recipient} (MessageId: ${info.messageId})`);
  if (testAccountUrl) {
    console.log(`[EMAIL] Preview URL: ${testAccountUrl}`);
  }

  return {
    success: true,
    recipient,
    messageId: info.messageId,
    previewUrl: testAccountUrl,
    jobCount: jobs.length
  };
}

/**
 * Initialize daily recurring job scanning cron
 */
function initScheduler(onTriggerSearch) {
  // Runs every day at 09:00 AM (server local time)
  cron.schedule('0 9 * * *', async () => {
    console.log('[CRON] Running 9:00 AM daily automated job scan & email digest...');
    try {
      const profile = readProfile();
      if (!profile.emailAlerts?.enabled) {
        console.log('[CRON] Daily alerts disabled in profile. Skipping email.');
        return;
      }

      if (onTriggerSearch) {
        const jobs = await onTriggerSearch();
        await sendJobDigestEmail(jobs);
      }
    } catch (err) {
      console.error('[CRON ERROR]', err.message);
    }
  });

  console.log('⏰ JobFlow AI Daily Cron Scheduler initialized (Scheduled: 09:00 AM daily)');
}

module.exports = {
  sendJobDigestEmail,
  initScheduler
};
