const db = require('../config/database');

// Toggle Bookmark for a Quiz
exports.toggleBookmark = (req, res) => {
  try {
    const userId = req.user.id;
    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ message: 'quizId is required' });
    }

    const existing = db.prepare('SELECT * FROM bookmarks WHERE user_id = ? AND quiz_id = ?').get(userId, quizId);

    if (existing) {
      db.prepare('DELETE FROM bookmarks WHERE user_id = ? AND quiz_id = ?').run(userId, quizId);
      if (db.saveBackup) db.saveBackup();
      return res.json({ bookmarked: false, message: 'Removed from Bookmarks' });
    } else {
      db.prepare('INSERT INTO bookmarks (user_id, quiz_id) VALUES (?, ?)').run(userId, quizId);
      if (db.saveBackup) db.saveBackup();
      return res.json({ bookmarked: true, message: 'Added to Bookmarks' });
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error);
    res.status(500).json({ message: 'Error processing bookmark' });
  }
};

// Get User Bookmarked Quiz IDs & Details
exports.getUserBookmarks = (req, res) => {
  try {
    const userId = req.user.id;

    const bookmarks = db.prepare(`
      SELECT b.quiz_id, b.created_at,
             q.title, q.description, q.difficulty, q.duration, q.passing_score,
             c.name as category_name, c.icon as category_icon
      FROM bookmarks b
      JOIN quizzes q ON b.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `).all(userId);

    const ids = bookmarks.map(b => b.quiz_id);

    res.json({ bookmarked_ids: ids, quizzes: bookmarks });
  } catch (error) {
    console.error('Error fetching bookmarks:', error);
    res.status(500).json({ message: 'Error fetching bookmarks' });
  }
};
