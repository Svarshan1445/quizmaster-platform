const db = require('../config/database');

// Helper to push notification to a student
function notifyUser(userId, title, message, type = 'info') {
  try {
    db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `).run(userId, title, message, type);
    if (db.saveBackup) db.saveBackup();
  } catch (e) {
    console.warn('Error pushing notification:', e.message);
  }
}

// Get student notifications
exports.getNotifications = (req, res) => {
  try {
    const userId = req.user.id;

    // Auto-create welcome notification if zero notifications exist
    const count = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ?').get(userId).count;
    if (count === 0) {
      notifyUser(userId, 'Welcome to QuizMaster! 🎓', 'Start exploring quizzes across multiple subjects and track your progress.', 'welcome');
    }

    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 20
    `).all(userId);

    const unreadCount = db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE user_id = ? AND is_read = 0
    `).get(userId).count;

    res.json({ notifications, unread_count: unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error loading notifications' });
  }
};

// Mark notifications as read
exports.markAsRead = (req, res) => {
  try {
    const userId = req.user.id;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);
    if (db.saveBackup) db.saveBackup();
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications' });
  }
};

exports.notifyUser = notifyUser;
