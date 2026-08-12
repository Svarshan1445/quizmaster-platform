const db = require('../config/database');

// Admin Dashboard Overview Statistics
exports.getAdminStats = (req, res) => {
  try {
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'STUDENT'").get().count;
    const totalQuizzes = db.prepare("SELECT COUNT(*) as count FROM quizzes").get().count;
    const publishedQuizzes = db.prepare("SELECT COUNT(*) as count FROM quizzes WHERE status = 'Published'").get().count;
    const draftQuizzes = db.prepare("SELECT COUNT(*) as count FROM quizzes WHERE status = 'Draft'").get().count;
    const totalQuestions = db.prepare("SELECT COUNT(*) as count FROM questions").get().count;

    const attemptStats = db.prepare(`
      SELECT COUNT(*) as total_attempts,
             AVG(percentage) as avg_score,
             SUM(CASE WHEN status = 'PASSED' THEN 1 ELSE 0 END) as passed_count,
             SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
      FROM attempts
      WHERE completed_at IS NOT NULL
    `).get();

    res.json({
      total_students: totalStudents,
      total_quizzes: totalQuizzes,
      published_quizzes: publishedQuizzes,
      draft_quizzes: draftQuizzes,
      total_questions: totalQuestions,
      total_attempts: attemptStats.total_attempts || 0,
      avg_score: attemptStats.avg_score ? parseFloat(attemptStats.avg_score.toFixed(1)) : 0,
      passed_attempts: attemptStats.passed_count || 0,
      failed_attempts: attemptStats.failed_count || 0
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error loading admin stats' });
  }
};

// Admin Detailed Analytics Charts Data
exports.getAdminAnalytics = (req, res) => {
  try {
    // 1. Pass/Fail distribution
    const passFail = db.prepare(`
      SELECT status, COUNT(*) as count
      FROM attempts
      WHERE completed_at IS NOT NULL
      GROUP BY status
    `).all();

    // 2. Most popular quizzes by attempt count
    const popularQuizzes = db.prepare(`
      SELECT q.title, COUNT(a.id) as attempts, AVG(a.percentage) as avg_score
      FROM quizzes q
      LEFT JOIN attempts a ON q.id = a.quiz_id AND a.completed_at IS NOT NULL
      GROUP BY q.id
      ORDER BY attempts DESC
      LIMIT 6
    `).all();

    const formattedPopular = popularQuizzes.map(item => ({
      ...item,
      avg_score: item.avg_score ? parseFloat(item.avg_score.toFixed(1)) : 0
    }));

    // 3. Category performance & attempt breakdown
    const categoryStats = db.prepare(`
      SELECT c.name as category, COUNT(a.id) as attempts, AVG(a.percentage) as avg_score
      FROM categories c
      JOIN quizzes q ON c.id = q.category_id
      LEFT JOIN attempts a ON q.id = a.quiz_id AND a.completed_at IS NOT NULL
      GROUP BY c.id
      HAVING attempts > 0
      ORDER BY attempts DESC
    `).all();

    const formattedCategory = categoryStats.map(item => ({
      ...item,
      avg_score: item.avg_score ? parseFloat(item.avg_score.toFixed(1)) : 0
    }));

    // 4. Attempts trend (grouped by date)
    const attemptsTrend = db.prepare(`
      SELECT DATE(completed_at) as date, COUNT(*) as count
      FROM attempts
      WHERE completed_at IS NOT NULL
      GROUP BY DATE(completed_at)
      ORDER BY date ASC
      LIMIT 14
    `).all();

    // 5. Student registrations trend
    const registrationTrend = db.prepare(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE role = 'STUDENT'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 14
    `).all();

    res.json({
      pass_fail: passFail,
      popular_quizzes: formattedPopular,
      category_stats: formattedCategory,
      attempts_trend: attemptsTrend,
      registration_trend: registrationTrend
    });
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    res.status(500).json({ message: 'Error loading analytics data' });
  }
};
