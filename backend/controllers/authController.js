const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { JWT_SECRET } = require('../middleware/auth');
const { sendLoginNotificationEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Ensure password_reset_tokens table exists
try {
  db.exec(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`);
} catch (e) { /* Already exists */ }

// Register new student
exports.register = (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare('INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)');
    const result = stmt.run(name.trim(), email.toLowerCase().trim(), hashedPassword, 'STUDENT', 'ACTIVE');

    if (db.saveBackup) db.saveBackup();

    const newUser = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);
    const token = jwt.sign({ id: newUser.id, email: newUser.email, role: newUser.role }, JWT_SECRET, { expiresIn: '7d' });

    // Send Welcome Email asynchronously
    sendWelcomeEmail(newUser.email, newUser.name);

    res.status(201).json({ message: 'Registration successful', token, user: newUser });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login user
exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase().trim());
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Your account has been deactivated. Contact admin.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status, created_at: user.created_at };

    // Send Login Email Notification asynchronously
    sendLoginNotificationEmail(user.email, user.name, user.role);

    res.json({ message: 'Login successful', token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Get current user profile
exports.getMe = (req, res) => {
  res.json({ user: req.user });
};

// Forgot Password — generate token & send email
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email address is required' });
    }

    const user = db.prepare('SELECT id, name, email FROM users WHERE email = ?').get(email.toLowerCase().trim());

    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Invalidate old tokens for this user
    db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id);

    // Store new token
    db.prepare('INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, resetToken, expiresAt);

    // Send reset email
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
};

// Reset Password — verify token & update password
exports.resetPassword = (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0').get(token);

    if (!record) {
      return res.status(400).json({ message: 'Invalid or already used reset link.' });
    }

    // Check expiry
    if (new Date() > new Date(record.expires_at)) {
      db.prepare('DELETE FROM password_reset_tokens WHERE id = ?').run(record.id);
      return res.status(400).json({ message: 'Reset link has expired. Please request a new one.' });
    }

    // Update password
    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, record.user_id);

    // Mark token as used
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE id = ?').run(record.id);

    if (db.saveBackup) db.saveBackup();

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error during password reset' });
  }
};

// Test Email sending endpoint for diagnostics
exports.testEmail = async (req, res) => {
  const targetEmail = req.query.email || 'svarshan1445@gmail.com';
  const envCheck = {
    EMAIL_USER: process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : null,
    EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
    RESEND_API_KEY_SET: !!process.env.RESEND_API_KEY,
    RESEND_KEY_PREFIX: process.env.RESEND_API_KEY ? process.env.RESEND_API_KEY.trim().substring(0, 5) + '...' : null,
    BREVO_API_KEY_SET: !!process.env.BREVO_API_KEY,
  };

  try {
    const { dispatchEmail } = require('../utils/emailService');
    const result = await dispatchEmail({
      to: targetEmail,
      subject: '🏆 QuizMaster Test Diagnostic Email',
      html: '<h2>QuizMaster Diagnostic Email</h2><p>If you see this, email sending works 100%!</p>'
    });

    res.json({
      message: 'Test email executed',
      envCheck,
      dispatch_result: result
    });
  } catch (err) {
    res.status(500).json({
      message: 'Test email failed with exception',
      envCheck,
      error: err.message,
      stack: err.stack
    });
  }
};

// Google One-Click Auth Login & Register [Student]
exports.googleLogin = async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Google email is required' });
    }

    const cleanEmail = email.toLowerCase().trim();
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      // Auto-register new student with Google account
      const randomPassword = bcrypt.hashSync(`google_${Date.now()}_${Math.random()}`, 10);
      const studentName = name || cleanEmail.split('@')[0];

      const result = db.prepare(`
        INSERT INTO users (name, email, password, role, status)
        VALUES (?, ?, ?, 'STUDENT', 'ACTIVE')
      `).run(studentName, cleanEmail, randomPassword);

      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);

      // Send welcome email in background
      try {
        const { sendWelcomeEmail } = require('../utils/emailService');
        sendWelcomeEmail(cleanEmail, studentName);
      } catch (e) {}
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Your student account has been deactivated. Please contact support.' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'quizmaster_super_secret_2024',
      { expiresIn: '7d' }
    );

    if (db.saveBackup) db.saveBackup();

    res.json({
      message: 'Google login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Google login error:', error);
    res.status(500).json({ message: 'Error processing Google authentication' });
  }
};
