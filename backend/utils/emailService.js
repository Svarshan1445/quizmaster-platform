const nodemailer = require('nodemailer');

// Configure Transporter (supports Gmail SMTP, Ethereal test account, or custom SMTP via env)
const createTransporter = async () => {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }

  // Fallback to test SMTP account (Ethereal) for instant zero-config testing
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn('Could not create test email account:', err.message);
    return null;
  }
};

// Send Login Notification Email
const sendLoginNotificationEmail = async (email, name, role = 'STUDENT') => {
  try {
    const transporter = await createTransporter();
    if (!transporter) return;

    const timeString = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

    const htmlContent = `
      <div style="font-family: 'Times New Roman', serif, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; line-height: 48px; font-size: 24px; color: white;">🏆</div>
          <h2 style="color: #ffffff; margin-top: 12px; font-size: 24px;">QuizMaster Platform</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Security Alert & Login Notification</p>
        </div>

        <div style="background: #1e293b; border-radius: 12px; padding: 20px; border-left: 4px solid #6366f1; margin-bottom: 24px;">
          <h3 style="color: #818cf8; margin: 0 0 8px 0; font-size: 16px;">Hello ${name},</h3>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0;">
            Your account <strong>${email}</strong> was successfully logged in to the QuizMaster Assessment Platform.
          </p>
        </div>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px 0; color: #94a3b8;">Account Role:</td>
            <td style="padding: 10px 0; color: #ffffff; text-align: right; font-weight: bold;">${role}</td>
          </tr>
          <tr style="border-bottom: 1px solid #334155;">
            <td style="padding: 10px 0; color: #94a3b8;">Login Time:</td>
            <td style="padding: 10px 0; color: #ffffff; text-align: right; font-weight: bold;">${timeString} (IST)</td>
          </tr>
          <tr>
            <td style="padding: 10px 0; color: #94a3b8;">Status:</td>
            <td style="padding: 10px 0; color: #34d399; text-align: right; font-weight: bold;">✓ Successful</td>
          </tr>
        </table>

        <div style="text-align: center; border-top: 1px solid #334155; pt-20; margin-top: 24px; padding-top: 20px;">
          <p style="color: #64748b; font-size: 12px; margin: 0;">If you did not perform this login, please contact your Administrator immediately.</p>
          <p style="color: #475569; font-size: 11px; margin-top: 8px;">QuizMaster Enterprise &copy; 2026</p>
        </div>
      </div>
    `;

    const info = await transporter.sendMail({
      from: '"QuizMaster Platform" <noreply@quizmaster.com>',
      to: email,
      subject: '🔐 Security Alert: Successful Login to QuizMaster',
      html: htmlContent
    });

    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      console.log('Test Email preview URL:', nodemailer.getTestMessageUrl(info));
    }
    console.log(`✓ Login notification email sent to ${email}`);
  } catch (err) {
    console.warn('Failed to send login email notification:', err.message);
  }
};

// Send Welcome Email on Registration
const sendWelcomeEmail = async (email, name) => {
  try {
    const transporter = await createTransporter();
    if (!transporter) return;

    const htmlContent = `
      <div style="font-family: 'Times New Roman', serif, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; padding: 32px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="display: inline-block; width: 48px; height: 48px; background: linear-gradient(135deg, #10b981, #14b8a6); border-radius: 12px; line-height: 48px; font-size: 24px; color: white;">🎓</div>
          <h2 style="color: #ffffff; margin-top: 12px; font-size: 24px;">Welcome to QuizMaster!</h2>
          <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">Student Account Created Successfully</p>
        </div>

        <div style="background: #1e293b; border-radius: 12px; padding: 20px; border-left: 4px solid #10b981; margin-bottom: 24px;">
          <h3 style="color: #34d399; margin: 0 0 8px 0; font-size: 16px;">Welcome, ${name}!</h3>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin: 0;">
            Your student account has been registered successfully. You can now take assessments, practice coding challenges, earn certificates, and compete on the global leaderboard.
          </p>
        </div>

        <div style="text-align: center; margin: 28px 0;">
          <a href="https://quizmaster-platform-iota.vercel.app" style="background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 12px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; font-size: 14px;">Explore Available Quizzes →</a>
        </div>

        <div style="text-align: center; border-top: 1px solid #334155; padding-top: 20px;">
          <p style="color: #475569; font-size: 11px;">QuizMaster Enterprise &copy; 2026 — Verified Student Learning</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: '"QuizMaster Platform" <noreply@quizmaster.com>',
      to: email,
      subject: '🎓 Welcome to QuizMaster Assessment Platform!',
      html: htmlContent
    });

    console.log(`✓ Welcome email sent to ${email}`);
  } catch (err) {
    console.warn('Failed to send welcome email:', err.message);
  }
};

module.exports = {
  sendLoginNotificationEmail,
  sendWelcomeEmail
};
