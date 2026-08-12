const db = require('../config/database');

// Get Leaderboard rankings
exports.getLeaderboard = (req, res) => {
  try {
    const { categoryId, timeframe } = req.query; // timeframe: 'all', 'month'

    let query = `
      SELECT u.id as user_id, u.name as student_name, u.email as student_email,
             COUNT(DISTINCT a.id) as total_attempts,
             SUM(CASE WHEN a.status = 'PASSED' THEN 1 ELSE 0 END) as passed_quizzes,
             AVG(a.percentage) as avg_score,
             MAX(a.percentage) as highest_score,
             SUM(a.score) as total_points
      FROM users u
      JOIN attempts a ON u.id = a.user_id AND a.completed_at IS NOT NULL
      JOIN quizzes q ON a.quiz_id = q.id
      WHERE u.role = 'STUDENT' AND u.status = 'ACTIVE'
    `;

    const params = [];

    if (categoryId) {
      query += ` AND q.category_id = ?`;
      params.push(categoryId);
    }

    if (timeframe === 'month') {
      query += ` AND a.completed_at >= DATE('now', '-30 days')`;
    }

    query += `
      GROUP BY u.id
      HAVING total_attempts > 0
      ORDER BY avg_score DESC, passed_quizzes DESC, total_points DESC
      LIMIT 50
    `;

    const leaderboard = db.prepare(query).all(...params);

    const ranked = leaderboard.map((user, index) => ({
      rank: index + 1,
      ...user,
      avg_score: user.avg_score ? parseFloat(user.avg_score.toFixed(1)) : 0,
      highest_score: user.highest_score ? parseFloat(user.highest_score.toFixed(1)) : 0
    }));

    res.json(ranked);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Error loading leaderboard rankings' });
  }
};
