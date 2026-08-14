const nodemailer = require('nodemailer');
const https = require('https');
const dns = require('dns');

const PLATFORM_NAME = 'QuizMaster';
const PLATFORM_URL = 'https://quizmaster-platform-iota.vercel.app';
const BRAND_COLOR = '#4f46e5';
const BRAND_LIGHT = '#eef2ff';

// Always use authenticated Gmail or configured email as sender
const getSender = () => process.env.EMAIL_USER
  ? `"${PLATFORM_NAME} Platform" <${process.env.EMAIL_USER.trim()}>`
  : `"${PLATFORM_NAME} Platform" <noreply@quizmaster.com>`;

// ─── Unified Email Dispatcher ────────────────────────────────────────────────
// Supports:
// 1. Resend HTTP REST API (Port 443 - Never blocked on Render) if RESEND_API_KEY is set
// 2. Brevo HTTP REST API (Port 443 - Never blocked on Render) if BREVO_API_KEY is set
// 3. Gmail / Custom SMTP with 5-second timeout guard
const dispatchEmail = async ({ to, subject, html }) => {
  const senderEmail = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : 'noreply@quizmaster.com';

  // Method 1: Brevo HTTP REST API (Port 443 HTTPS - Allows sending to ANY student email address without domain restriction)
  if (process.env.BREVO_API_KEY) {
    try {
      return await sendViaBrevoApi({ to, subject, html, senderEmail });
    } catch (e) {
      console.error('Brevo HTTP API error:', e.message);
      return { error: `Brevo Error: ${e.message}` };
    }
  }

  // Method 2: Resend HTTP REST API (Port 443 HTTPS)
  if (process.env.RESEND_API_KEY) {
    try {
      return await sendViaResendApi({ to, subject, html, from: 'QuizMaster <onboarding@resend.dev>' });
    } catch (e) {
      console.error('Resend HTTP API error:', e.message);
      if (process.env.DEBUG_EMAIL) throw e;
      return { error: e.message };
    }
  }

  // Method 3: Nodemailer SMTP with 5s timeout safety
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    try {
      const cleanPass = process.env.EMAIL_PASS.replace(/\s/g, '');
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        connectionTimeout: 5000, // 5s timeout guard
        greetingTimeout: 5000,
        socketTimeout: 5000,
        auth: {
          user: senderEmail,
          pass: cleanPass
        },
        tls: {
          rejectUnauthorized: false
        },
        lookup: (hostname, opts, cb) => {
          const callback = typeof opts === 'function' ? opts : cb;
          dns.lookup(hostname, { family: 4 }, (err, address, family) => {
            if (typeof callback === 'function') callback(err, address, family);
          });
        }
      });

      await transporter.sendMail({
        from: getSender(),
        to,
        subject,
        html
      });
      console.log(`✓ Email sent via SMTP to ${to}`);
      return true;
    } catch (err) {
      console.warn(`SMTP email sending to ${to} deferred:`, err.message);
      return false; // Return false gracefully without crashing backend server
    }
  }

  console.warn(`No email credentials or API keys configured. Email to ${to} skipped.`);
  return false;
};

// Resend HTTPS REST API Sender (Port 443)
function sendViaResendApi({ to, subject, html, from }) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ from, to: [to], subject, html });
    const req = https.request({
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY.trim()}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ Email sent via Resend HTTPS API to ${to}`);
          resolve(true);
        } else {
          reject(new Error(`Resend API HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Brevo HTTPS REST API Sender (Port 443)
function sendViaBrevoApi({ to, subject, html, senderEmail }) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      sender: { name: PLATFORM_NAME, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html
    });
    const req = https.request({
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY.trim(),
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✓ Email sent via Brevo HTTPS API to ${to}`);
          resolve(true);
        } else {
          reject(new Error(`Brevo API HTTP ${res.statusCode}: ${body}`));
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// ─── Shared Layout Wrapper (Internshala-inspired clean light theme) ───────────
const emailWrapper = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${PLATFORM_NAME}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:${BRAND_COLOR};padding:28px 40px;text-align:left;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="width:40px;height:40px;background:rgba(255,255,255,0.2);border-radius:10px;text-align:center;vertical-align:middle;font-size:22px;">🏆</td>
                <td style="padding-left:12px;">
                  <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.5px;">${PLATFORM_NAME}</span><br/>
                  <span style="color:rgba(255,255,255,0.75);font-size:12px;">Assessment & Certification Platform</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:36px 40px;">
          ${bodyContent}
        </td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
            <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">This is an automated email from ${PLATFORM_NAME} Platform. Please do not reply to this email.</p>
            <p style="color:#cbd5e1;font-size:11px;margin:0;">© 2026 ${PLATFORM_NAME} Enterprise · <a href="${PLATFORM_URL}" style="color:${BRAND_COLOR};text-decoration:none;">Visit Platform</a></p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── CTA Button ───────────────────────────────────────────────────────────────
const ctaButton = (text, url, color = BRAND_COLOR) =>
  `<table cellpadding="0" cellspacing="0" style="margin:24px auto;">
    <tr><td style="background:${color};border-radius:8px;">
      <a href="${url}" style="display:inline-block;padding:13px 32px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">${text} →</a>
    </td></tr>
  </table>`;

// ─── Info Row for tables ──────────────────────────────────────────────────────
const infoRow = (label, value, valueColor = '#1e293b') =>
  `<tr style="border-bottom:1px solid #f1f5f9;">
    <td style="padding:10px 0;color:#64748b;font-size:13px;width:40%;">${label}</td>
    <td style="padding:10px 0;color:${valueColor};font-size:13px;font-weight:600;text-align:right;">${value}</td>
  </tr>`;

// ─── 1. Welcome Email (on Register) ──────────────────────────────────────────
const sendWelcomeEmail = async (email, name) => {
  try {
    const body = `
      <h2 style="color:#1e293b;font-size:22px;margin:0 0 6px;">Welcome to ${PLATFORM_NAME}, ${name}! 🎓</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Your student account has been created successfully. You're all set to start your learning journey.</p>

      <div style="background:${BRAND_LIGHT};border-radius:10px;padding:20px 24px;margin-bottom:24px;">
        <p style="color:#3730a3;font-weight:600;font-size:14px;margin:0 0 12px;">What you can do on ${PLATFORM_NAME}:</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr><td style="padding:5px 0;color:#4338ca;font-size:13px;">📚 &nbsp;Browse and attempt quizzes across multiple categories</td></tr>
          <tr><td style="padding:5px 0;color:#4338ca;font-size:13px;">💻 &nbsp;Solve real-world coding & programming challenges</td></tr>
          <tr><td style="padding:5px 0;color:#4338ca;font-size:13px;">🏆 &nbsp;Earn certificates upon passing assessments</td></tr>
          <tr><td style="padding:5px 0;color:#4338ca;font-size:13px;">📊 &nbsp;Track your progress and compete on the leaderboard</td></tr>
        </table>
      </div>

      <p style="color:#64748b;font-size:13px;text-align:center;margin:0 0 4px;">Your registered email address:</p>
      <p style="color:#1e293b;font-size:14px;font-weight:600;text-align:center;margin:0 0 20px;">${email}</p>

      ${ctaButton('Start Exploring Quizzes', PLATFORM_URL, '#10b981')}

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">If you did not create this account, please ignore this email.</p>
    `;

    const sent = await dispatchEmail({
      to: email,
      subject: `🎓 Welcome to ${PLATFORM_NAME} — Account Created Successfully`,
      html: emailWrapper(body)
    });

    // Notify admin about new registration
    if (process.env.EMAIL_USER && process.env.EMAIL_USER.trim() !== email) {
      const adminBody = `
        <h2 style="color:#1e293b;font-size:20px;margin:0 0 6px;">New Student Registration 🆕</h2>
        <p style="color:#64748b;font-size:14px;margin:0 0 24px;">A new student has just joined the ${PLATFORM_NAME} platform.</p>
        <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
          ${infoRow('Full Name', name)}
          ${infoRow('Email Address', email, '#4f46e5')}
          ${infoRow('Registered At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST')}
          ${infoRow('Account Status', '✅ Active', '#10b981')}
        </table>
        ${ctaButton('View in Admin Panel', `${PLATFORM_URL}`)}
      `;
      await dispatchEmail({
        to: process.env.EMAIL_USER.trim(),
        subject: `🆕 New Student Registered: ${name}`,
        html: emailWrapper(adminBody)
      });
    }

    return sent;
  } catch (err) {
    console.warn('Welcome email error:', err.message);
    return false;
  }
};

// ─── 2. Login Security Alert Email ───────────────────────────────────────────
const sendLoginNotificationEmail = async (email, name, role = 'STUDENT') => {
  try {
    const timeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const body = `
      <h2 style="color:#1e293b;font-size:22px;margin:0 0 6px;">Successful Login Alert 🔐</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Hi <strong>${name}</strong>, your ${PLATFORM_NAME} account was accessed successfully.</p>

      <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:24px;">
        <p style="color:#92400e;font-size:13px;margin:0;"><strong>Security Notice:</strong> If this wasn't you, please change your password immediately and contact the administrator.</p>
      </div>

      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        ${infoRow('Account Name', name)}
        ${infoRow('Email Address', email, '#4f46e5')}
        ${infoRow('Account Role', role)}
        ${infoRow('Login Time', timeString + ' (IST)')}
        ${infoRow('Login Status', '✅ Successful', '#10b981')}
      </table>

      ${ctaButton('Go to My Dashboard', PLATFORM_URL)}

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0;">Not you? Contact your administrator at <a href="mailto:${process.env.EMAIL_USER || 'admin@quizmaster.com'}" style="color:${BRAND_COLOR};">${process.env.EMAIL_USER || 'admin@quizmaster.com'}</a></p>
    `;

    return await dispatchEmail({
      to: email,
      subject: `🔐 Security Alert: Successful Login to ${PLATFORM_NAME}`,
      html: emailWrapper(body)
    });
  } catch (err) {
    console.warn('Login email error:', err.message);
    return false;
  }
};

// ─── 3. Quiz Result Email ─────────────────────────────────────────────────────
const sendQuizResultEmail = async (email, name, quizTitle, score, percentage, status) => {
  try {
    const passed = status === 'PASSED';
    const statusColor = passed ? '#10b981' : '#ef4444';
    const statusBg = passed ? '#f0fdf4' : '#fef2f2';
    const statusBorder = passed ? '#86efac' : '#fca5a5';

    const body = `
      <h2 style="color:#1e293b;font-size:22px;margin:0 0 6px;">Your Quiz Result is Ready ${passed ? '🏆' : '📘'}</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Hi <strong>${name}</strong>, your submission for <strong>${quizTitle}</strong> has been evaluated.</p>

      <div style="background:${statusBg};border:1px solid ${statusBorder};border-radius:10px;padding:20px 24px;text-align:center;margin-bottom:24px;">
        <p style="color:${statusColor};font-size:36px;font-weight:800;margin:0 0 4px;">${percentage}%</p>
        <p style="color:${statusColor};font-size:18px;font-weight:700;margin:0;">${passed ? '✅ PASSED' : '❌ FAILED'}</p>
      </div>

      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        ${infoRow('Quiz Title', quizTitle)}
        ${infoRow('Your Score', score)}
        ${infoRow('Percentage', `${percentage}%`, statusColor)}
        ${infoRow('Result', passed ? '✅ PASSED' : '❌ FAILED', statusColor)}
        ${infoRow('Completed At', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST')}
      </table>

      ${passed
        ? `<div style="background:#f0fdf4;border-radius:8px;padding:14px 18px;margin:20px 0 0;text-align:center;">
             <p style="color:#166534;font-size:13px;margin:0;">🎉 Congratulations! You may now download your certificate from your dashboard.</p>
           </div>`
        : `<div style="background:#fef2f2;border-radius:8px;padding:14px 18px;margin:20px 0 0;text-align:center;">
             <p style="color:#991b1b;font-size:13px;margin:0;">Keep practicing! Review your answers and try again to improve your score.</p>
           </div>`
      }

      ${ctaButton('View Full Results', PLATFORM_URL, statusColor)}
    `;

    return await dispatchEmail({
      to: email,
      subject: `${passed ? '🏆' : '📘'} Quiz Result: ${status} — ${quizTitle} (${percentage}%)`,
      html: emailWrapper(body)
    });
  } catch (err) {
    console.warn('Quiz result email error:', err.message);
    return false;
  }
};

// ─── 4. Forgot Password / Reset Link Email ────────────────────────────────────
const sendPasswordResetEmail = async (email, name, resetToken) => {
  try {
    const resetUrl = `${PLATFORM_URL}/?reset_token=${resetToken}`;

    const body = `
      <h2 style="color:#1e293b;font-size:22px;margin:0 0 6px;">Reset Your Password 🔑</h2>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">Hi <strong>${name}</strong>, we received a request to reset the password for your ${PLATFORM_NAME} account.</p>

      <div style="background:${BRAND_LIGHT};border-radius:10px;padding:20px 24px;margin-bottom:24px;text-align:center;">
        <p style="color:#3730a3;font-size:14px;font-weight:600;margin:0 0 16px;">Click the button below to set a new password:</p>
        ${ctaButton('Reset My Password', resetUrl)}
        <p style="color:#94a3b8;font-size:12px;margin:12px 0 0;">⏰ This link will expire in <strong>1 hour</strong> for security reasons.</p>
      </div>

      <div style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:20px;">
        <p style="color:#92400e;font-size:13px;margin:0;"><strong>Didn't request this?</strong> If you did not request a password reset, please ignore this email. Your account remains secure.</p>
      </div>

      <table cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;">
        ${infoRow('Account Email', email, '#4f46e5')}
        ${infoRow('Request Time', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST')}
        ${infoRow('Link Expires In', '1 Hour')}
      </table>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:20px 0 0;">If the button above doesn't work, copy and paste this link into your browser:<br/>
        <a href="${resetUrl}" style="color:${BRAND_COLOR};word-break:break-all;font-size:11px;">${resetUrl}</a>
      </p>
    `;

    return await dispatchEmail({
      to: email,
      subject: `🔑 Password Reset Request — ${PLATFORM_NAME}`,
      html: emailWrapper(body)
    });
  } catch (err) {
    console.warn('Password reset email error:', err.message);
    return false;
  }
};

module.exports = {
  dispatchEmail,
  sendWelcomeEmail,
  sendLoginNotificationEmail,
  sendQuizResultEmail,
  sendPasswordResetEmail
};
