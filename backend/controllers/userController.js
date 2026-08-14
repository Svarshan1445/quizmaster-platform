const db = require('../config/database');
const bcrypt = require('bcryptjs');

// Get all users [Admin]
exports.getUsers = (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = `
      SELECT u.id, u.name, u.email, u.phone_number, u.role, u.status, u.created_at,
             COUNT(DISTINCT a.id) as total_attempts,
             AVG(a.percentage) as avg_score,
             MAX(a.percentage) as highest_score
      FROM users u
      LEFT JOIN attempts a ON u.id = a.user_id AND a.completed_at IS NOT NULL
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC`;

    const users = db.prepare(query).all(...params);

    const formatted = users.map(u => ({
      ...u,
      avg_score: u.avg_score ? parseFloat(u.avg_score.toFixed(1)) : 0,
      highest_score: u.highest_score ? parseFloat(u.highest_score.toFixed(1)) : 0
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users list' });
  }
};

// Toggle user status [Admin]
exports.updateUserStatus = (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // First check if users table has status column; if not, add it
    try {
      db.exec(`ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE'`);
    } catch (e) { /* Column already exists, ignore */ }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ message: `User with id ${userId} not found` });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot deactivate Admin account' });
    }

    const currentStatus = user.status || 'ACTIVE';
    const newStatus = (currentStatus === 'ACTIVE') ? 'INACTIVE' : 'ACTIVE';
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(newStatus, userId);

    if (db.saveBackup) db.saveBackup();

    res.json({ message: `User status updated to ${newStatus}`, status: newStatus });
  } catch (error) {
    console.error('Error updating user status:', error.message, error.stack);
    res.status(500).json({ message: 'Error updating user status', detail: error.message });
  }
};

// Delete user account [Admin] - Removes user & all attempts so student can re-register anytime
exports.deleteUser = (req, res) => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'ADMIN') {
      return res.status(400).json({ message: 'Cannot delete Admin account' });
    }

    // Clean deletion transaction handling foreign keys
    const deleteTx = db.transaction(() => {
      // 1. Delete answers for user's attempts
      db.prepare(`
        DELETE FROM answers WHERE attempt_id IN (
          SELECT id FROM attempts WHERE user_id = ?
        )
      `).run(userId);

      // 2. Delete user's attempts
      db.prepare('DELETE FROM attempts WHERE user_id = ?').run(userId);

      // 3. Delete password reset tokens
      try {
        db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(userId);
      } catch (e) { /* Table might not exist yet */ }

      // 4. Delete user record
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);
    });

    deleteTx();

    if (db.saveBackup) db.saveBackup();
    res.json({ message: `Student account ${user.email} deleted successfully. They can now re-register anytime.` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user account', detail: error.message });
  }
};

// Student Dashboard Overview
exports.getStudentDashboard = (req, res) => {
  try {
    const userId = req.user.id;

    const attemptsCount = db.prepare('SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND completed_at IS NOT NULL').get(userId).count;
    const passedCount = db.prepare("SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND status = 'PASSED' AND completed_at IS NOT NULL").get(userId).count;
    const failedCount = db.prepare("SELECT COUNT(*) as count FROM attempts WHERE user_id = ? AND status = 'FAILED' AND completed_at IS NOT NULL").get(userId).count;

    const scoreStats = db.prepare(`
      SELECT AVG(percentage) as avg_score, MAX(percentage) as highest_score, SUM(correct_answers) as total_correct
      FROM attempts 
      WHERE user_id = ? AND completed_at IS NOT NULL
    `).get(userId);

    const recentAttempts = db.prepare(`
      SELECT a.*, q.title as quiz_title, c.name as category_name
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE a.user_id = ? AND a.completed_at IS NOT NULL
      ORDER BY a.completed_at DESC
      LIMIT 5
    `).all(userId);

    const categoryMastery = db.prepare(`
      SELECT c.name as category_name,
             COUNT(a.id) as total_attempts,
             AVG(a.percentage) as avg_score,
             MAX(a.percentage) as highest_score
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE a.user_id = ? AND a.completed_at IS NOT NULL
      GROUP BY q.category_id
      ORDER BY avg_score ASC
    `).all(userId).map(c => ({
      ...c,
      avg_score: parseFloat((c.avg_score || 0).toFixed(1)),
      status: c.avg_score >= 80 ? 'Mastered' : c.avg_score >= 60 ? 'Proficient' : 'Needs Practice'
    }));

    let certsCount = 0;
    try {
      certsCount = db.prepare('SELECT COUNT(*) as count FROM certificates WHERE user_id = ?').get(userId).count;
    } catch (e) {}

    // Dynamic study streak calculation (consecutive active days)
    const activeDates = db.prepare(`
      SELECT DISTINCT DATE(completed_at) as active_date
      FROM attempts
      WHERE user_id = ? AND completed_at IS NOT NULL
      ORDER BY active_date DESC
    `).all(userId).map(r => r.active_date);

    let streakDays = 0;
    if (activeDates.length > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (activeDates.includes(todayStr) || activeDates.includes(yesterdayStr)) {
        let curr = new Date(activeDates.includes(todayStr) ? todayStr : yesterdayStr);
        streakDays = 1;

        while (true) {
          curr.setDate(curr.getDate() - 1);
          const prevStr = curr.toISOString().split('T')[0];
          if (activeDates.includes(prevStr)) {
            streakDays++;
          } else {
            break;
          }
        }
      }
    }

    res.json({
      total_attempts: attemptsCount,
      passed_count: passedCount,
      failed_count: failedCount,
      avg_score: scoreStats.avg_score ? parseFloat(scoreStats.avg_score.toFixed(1)) : 0,
      highest_score: scoreStats.highest_score ? parseFloat(scoreStats.highest_score.toFixed(1)) : 0,
      total_correct_answers: scoreStats.total_correct || 0,
      recent_attempts: recentAttempts,
      category_mastery: categoryMastery,
      certificates_count: certsCount,
      streak_days: streakDays
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ message: 'Error loading student dashboard metrics' });
  }
};

// Student Performance Chart — score over last N attempts
exports.getPerformanceChart = (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 10;

    const attempts = db.prepare(`
      SELECT a.percentage, a.status, a.completed_at, q.title as quiz_title
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE a.user_id = ? AND a.completed_at IS NOT NULL
      ORDER BY a.completed_at ASC
      LIMIT ?
    `).all(userId, limit);

    const categoryStats = db.prepare(`
      SELECT c.name as category, AVG(a.percentage) as avg_score, COUNT(a.id) as attempts
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE a.user_id = ? AND a.completed_at IS NOT NULL
      GROUP BY q.category_id
      ORDER BY attempts DESC
      LIMIT 6
    `).all(userId).map(r => ({ ...r, avg_score: parseFloat((r.avg_score || 0).toFixed(1)) }));

    res.json({ attempts, category_stats: categoryStats });
  } catch (error) {
    console.error('Error fetching performance chart:', error);
    res.status(500).json({ message: 'Error fetching performance data' });
  }
};

// Update student profile [Student]
exports.updateProfile = (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), userId);
    const updated = db.prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?').get(userId);
    res.json({ message: 'Profile updated successfully', user: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

// Change password [Student]
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, userId);
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Error changing password' });
  }
};
