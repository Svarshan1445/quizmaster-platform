const db = require('../config/database');

// Get all quizzes (with filtering for search, category, difficulty, duration)
exports.getQuizzes = (req, res) => {
  try {
    const { search, category, difficulty, status } = req.query;
    let query = `
      SELECT q.*, c.name as category_name, c.icon as category_icon,
             (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
             (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id) as attempt_count
      FROM quizzes q
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (!req.user || req.user.role !== 'ADMIN') {
      query += ` AND q.status = 'Published'`;
    } else if (status) {
      query += ` AND q.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (q.title LIKE ? OR q.description LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      query += ` AND (q.category_id = ? OR c.name = ? OR c.name LIKE ?)`;
      params.push(category, category, `%${category}%`);
    }

    if (difficulty) {
      query += ` AND q.difficulty = ?`;
      params.push(difficulty);
    }

    query += ` ORDER BY q.created_at DESC`;

    const quizzes = db.prepare(query).all(...params);
    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Error fetching quizzes' });
  }
};

// Get single quiz by ID
exports.getQuizById = (req, res) => {
  try {
    const { id } = req.params;
    const quiz = db.prepare(`
      SELECT q.*, c.name as category_name, c.icon as category_icon,
             (SELECT COUNT(*) FROM questions WHERE quiz_id = q.id) as question_count,
             (SELECT SUM(marks) FROM questions WHERE quiz_id = q.id) as total_marks,
             (SELECT COUNT(*) FROM attempts WHERE quiz_id = q.id) as attempt_count
      FROM quizzes q
      LEFT JOIN categories c ON q.category_id = c.id
      WHERE q.id = ?
    `).get(id);

    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (req.user && req.user.role === 'STUDENT') {
      const userAttempts = db.prepare('SELECT COUNT(*) as count FROM attempts WHERE quiz_id = ? AND user_id = ? AND completed_at IS NOT NULL').get(id, req.user.id);
      quiz.user_attempts_count = userAttempts ? userAttempts.count : 0;
      quiz.can_attempt = quiz.user_attempts_count < quiz.max_attempts;
    }

    res.json(quiz);
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Error fetching quiz details' });
  }
};

// Create quiz [Admin]
exports.createQuiz = (req, res) => {
  try {
    const { title, description, category_id, difficulty, duration, passing_score, max_attempts, status, shuffle_questions, shuffle_options, negative_marks, image_url } = req.body;

    if (!title || !duration || !passing_score) {
      return res.status(400).json({ message: 'Title, duration, and passing score are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO quizzes (title, description, category_id, difficulty, duration, passing_score, max_attempts, status, shuffle_questions, shuffle_options, negative_marks, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title.trim(),
      description || '',
      category_id || null,
      difficulty || 'Intermediate',
      parseInt(duration, 10),
      parseInt(passing_score, 10),
      max_attempts ? parseInt(max_attempts, 10) : 3,
      status || 'Draft',
      shuffle_questions ? 1 : 0,
      shuffle_options ? 1 : 0,
      parseFloat(negative_marks) || 0,
      image_url || null
    );

    const newQuiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newQuiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Error creating quiz' });
  }
};

// Update quiz [Admin]
exports.updateQuiz = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, difficulty, duration, passing_score, max_attempts, status, shuffle_questions, shuffle_options, negative_marks, image_url } = req.body;

    const quiz = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    db.prepare(`
      UPDATE quizzes 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          difficulty = COALESCE(?, difficulty),
          duration = COALESCE(?, duration),
          passing_score = COALESCE(?, passing_score),
          max_attempts = COALESCE(?, max_attempts),
          status = COALESCE(?, status),
          shuffle_questions = COALESCE(?, shuffle_questions),
          shuffle_options = COALESCE(?, shuffle_options),
          negative_marks = COALESCE(?, negative_marks),
          image_url = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, category_id, difficulty, duration, passing_score, max_attempts, status,
           shuffle_questions !== undefined ? (shuffle_questions ? 1 : 0) : null,
           shuffle_options !== undefined ? (shuffle_options ? 1 : 0) : null,
           negative_marks !== undefined ? parseFloat(negative_marks) : null,
           image_url ? image_url : null,
           id);

    const updated = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ message: 'Error updating quiz' });
  }
};

// Toggle status publish/unpublish [Admin]
exports.togglePublishStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    const newStatus = status || (quiz.status === 'Published' ? 'Unpublished' : 'Published');

    if (newStatus === 'Published') {
      const qCount = db.prepare('SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?').get(id);
      if (!qCount || qCount.count === 0) {
        return res.status(400).json({ message: 'Cannot publish a quiz with 0 questions. Please add questions first.' });
      }
    }

    db.prepare('UPDATE quizzes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, id);
    res.json({ message: `Quiz status updated to ${newStatus}`, status: newStatus });
  } catch (error) {
    console.error('Error toggling status:', error);
    res.status(500).json({ message: 'Error toggling quiz publish status' });
  }
};

// Delete quiz [Admin]
exports.deleteQuiz = (req, res) => {
  try {
    const { id } = req.params;
    const quiz = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(id);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }
    db.prepare('DELETE FROM quizzes WHERE id = ?').run(id);
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Error deleting quiz' });
  }
};
