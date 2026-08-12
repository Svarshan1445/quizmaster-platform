const db = require('../config/database');

// Get questions for a quiz
exports.getQuestionsByQuiz = (req, res) => {
  try {
    const { quizId } = req.params;
    const isAdmin = req.user && req.user.role === 'ADMIN';

    const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC').all(quizId);

    const fullQuestions = questions.map(q => {
      let options;
      if (isAdmin) {
        options = db.prepare('SELECT id, question_id, option_text, is_correct FROM options WHERE question_id = ?').all(q.id);
      } else {
        // Hide correct answer flag for students during quiz attempt (unless it's fill in the blanks, where options shouldn't be revealed anyway)
        if (q.question_type === 'FILL_BLANK') {
          options = []; // Don't give away fill blank answer to frontend
        } else {
          options = db.prepare('SELECT id, question_id, option_text FROM options WHERE question_id = ?').all(q.id);
        }
      }
      return {
        ...q,
        options
      };
    });

    res.json(fullQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Error fetching questions' });
  }
};

// Create question with options [Admin]
exports.createQuestion = (req, res) => {
  try {
    const { quizId } = req.params;
    const { question_text, marks, explanation, difficulty, question_type, options } = req.body;

    const qType = question_type || 'MCQ';

    if (!question_text) {
      return res.status(400).json({ message: 'Question text is required' });
    }

    if (!options || !Array.isArray(options) || options.length === 0) {
      return res.status(400).json({ message: 'Options are required' });
    }

    const quiz = db.prepare('SELECT id FROM quizzes WHERE id = ?').get(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    // Insert question within transaction
    const insertTx = db.transaction(() => {
      const qStmt = db.prepare(`
        INSERT INTO questions (quiz_id, question_text, marks, explanation, difficulty, question_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const qResult = qStmt.run(quizId, question_text.trim(), marks || 1, explanation || '', difficulty || 'Intermediate', qType);
      const questionId = qResult.lastInsertRowid;

      const optStmt = db.prepare('INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)');
      for (const opt of options) {
        optStmt.run(questionId, opt.option_text.trim(), opt.is_correct ? 1 : 0);
      }

      return questionId;
    });

    const newQuestionId = insertTx();
    const newQuestion = db.prepare('SELECT * FROM questions WHERE id = ?').get(newQuestionId);
    newQuestion.options = db.prepare('SELECT * FROM options WHERE question_id = ?').all(newQuestionId);

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Error creating question' });
  }
};

// Update question with options [Admin]
exports.updateQuestion = (req, res) => {
  try {
    const { id } = req.params;
    const { question_text, marks, explanation, difficulty, question_type, options } = req.body;

    const question = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const updateTx = db.transaction(() => {
      db.prepare(`
        UPDATE questions 
        SET question_text = COALESCE(?, question_text),
            marks = COALESCE(?, marks),
            explanation = COALESCE(?, explanation),
            difficulty = COALESCE(?, difficulty),
            question_type = COALESCE(?, question_type)
        WHERE id = ?
      `).run(question_text, marks, explanation, difficulty, question_type, id);

      if (options && Array.isArray(options) && options.length > 0) {
        // Replace existing options
        db.prepare('DELETE FROM options WHERE question_id = ?').run(id);
        const optStmt = db.prepare('INSERT INTO options (question_id, option_text, is_correct) VALUES (?, ?, ?)');
        for (const opt of options) {
          optStmt.run(id, opt.option_text.trim(), opt.is_correct ? 1 : 0);
        }
      }
    });

    updateTx();

    const updated = db.prepare('SELECT * FROM questions WHERE id = ?').get(id);
    updated.options = db.prepare('SELECT * FROM options WHERE question_id = ?').all(id);

    res.json(updated);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Error updating question' });
  }
};

// Delete question [Admin]
exports.deleteQuestion = (req, res) => {
  try {
    const { id } = req.params;
    const question = db.prepare('SELECT id FROM questions WHERE id = ?').get(id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    db.prepare('DELETE FROM questions WHERE id = ?').run(id);
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Error deleting question' });
  }
};
