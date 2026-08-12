const db = require('../config/database');

// Shuffle array utility
function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Start a quiz attempt session [Student]
exports.startAttempt = (req, res) => {
  try {
    const { quizId } = req.params;
    const userId = req.user.id;

    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
    if (!quiz) {
      return res.status(404).json({ message: 'Quiz not found' });
    }

    if (quiz.status !== 'Published' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'This quiz is currently not published' });
    }

    // Check maximum completed attempts
    const attemptsCount = db.prepare('SELECT COUNT(*) as count FROM attempts WHERE quiz_id = ? AND user_id = ? AND completed_at IS NOT NULL').get(quizId, userId);
    if (attemptsCount && attemptsCount.count >= quiz.max_attempts && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        message: `Maximum attempts limit reached (${quiz.max_attempts} attempt${quiz.max_attempts > 1 ? 's' : ''} allowed)`
      });
    }

    // Clear any stale uncompleted IN_PROGRESS attempts for this user and quiz
    db.prepare("DELETE FROM attempts WHERE quiz_id = ? AND user_id = ? AND completed_at IS NULL").run(quizId, userId);

    // Fetch questions
    let questions = db.prepare('SELECT id, question_text, question_type, marks, difficulty FROM questions WHERE quiz_id = ? ORDER BY id ASC').all(quizId);
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: 'Quiz has no questions available' });
    }

    // Shuffle questions if enabled
    if (quiz.shuffle_questions) {
      questions = shuffleArray(questions);
    }

    const formattedQuestions = questions.map(q => {
      let options = [];
      if (q.question_type !== 'FILL_BLANK') {
        options = db.prepare('SELECT id, question_id, option_text FROM options WHERE question_id = ?').all(q.id);
        options = shuffleArray(options);
      }
      return { ...q, options };
    });

    // Calculate total possible marks
    const totalMarks = db.prepare('SELECT SUM(marks) as total FROM questions WHERE quiz_id = ?').get(quizId).total || questions.length;

    // Insert new attempt session record
    const startedAtISO = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO attempts (quiz_id, user_id, total_marks, total_questions, status, started_at)
      VALUES (?, ?, ?, ?, 'IN_PROGRESS', ?)
    `);
    const result = stmt.run(quizId, userId, totalMarks, questions.length, startedAtISO);
    const attemptId = result.lastInsertRowid;

    res.status(201).json({
      attempt_id: attemptId,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        duration: quiz.duration,
        passing_score: quiz.passing_score,
        negative_marks: quiz.negative_marks || 0
      },
      questions: formattedQuestions,
      started_at: startedAtISO
    });
  } catch (error) {
    console.error('Error starting attempt:', error);
    res.status(500).json({ message: 'Error starting quiz attempt' });
  }
};

// Submit quiz attempt & process score [Student]
exports.submitAttempt = (req, res) => {
  try {
    const { quizId } = req.params;
    const { attempt_id, answers } = req.body;
    const userId = req.user.id;

    const attempt = db.prepare('SELECT * FROM attempts WHERE id = ? AND quiz_id = ? AND user_id = ?').get(attempt_id, quizId, userId);
    if (!attempt) {
      return res.status(404).json({ message: 'Attempt record not found' });
    }

    if (attempt.completed_at) {
      return res.status(400).json({ message: 'This attempt has already been submitted' });
    }

    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
    const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ?').all(quizId);
    const negativeMarksPerQ = parseFloat(quiz.negative_marks) || 0;

    let obtainedScore = 0;
    let totalPossibleMarks = 0;
    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;

    const userAnswers = answers || {};

    const processTx = db.transaction(() => {
      const answerStmt = db.prepare(`
        INSERT INTO answers (attempt_id, question_id, selected_option_id, user_text_answer, is_correct)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const q of questions) {
        totalPossibleMarks += q.marks;
        const userAnswer = userAnswers[q.id];

        if (q.question_type === 'FILL_BLANK' || q.question_type === 'CODING') {
          const textAns = (typeof userAnswer === 'string' ? userAnswer : '').trim();
          if (!textAns) {
            unansweredCount++;
            answerStmt.run(attempt_id, q.id, null, null, 0);
          } else {
            // Compare text with acceptable options for fill in blank or coding exercise
            const validOptions = db.prepare('SELECT option_text FROM options WHERE question_id = ?').all(q.id);
            const normUser = textAns.toLowerCase().replace(/\s+/g, ' ');
            const isCorrect = validOptions.some(opt => {
              const normOpt = opt.option_text.trim().toLowerCase().replace(/\s+/g, ' ');
              return normOpt === normUser || normUser.includes(normOpt) || normOpt.includes(normUser);
            });

            if (isCorrect) {
              obtainedScore += q.marks;
              correctCount++;
            } else {
              obtainedScore -= negativeMarksPerQ;
              incorrectCount++;
            }
            answerStmt.run(attempt_id, q.id, null, textAns, isCorrect ? 1 : 0);
          }
        } else {
          // MCQ or TRUE_FALSE
          const selectedOptionId = userAnswer ? parseInt(userAnswer, 10) : null;

          if (!selectedOptionId) {
            unansweredCount++;
            answerStmt.run(attempt_id, q.id, null, null, 0);
          } else {
            const option = db.prepare('SELECT is_correct FROM options WHERE id = ? AND question_id = ?').get(selectedOptionId, q.id);
            const isCorrect = option && option.is_correct === 1 ? 1 : 0;

            if (isCorrect) {
              obtainedScore += q.marks;
              correctCount++;
            } else {
              obtainedScore -= negativeMarksPerQ;
              incorrectCount++;
            }

            answerStmt.run(attempt_id, q.id, selectedOptionId, null, isCorrect);
          }
        }
      }

      // Clamp score to 0 minimum
      obtainedScore = Math.max(0, obtainedScore);

      const percentage = totalPossibleMarks > 0 ? parseFloat(((obtainedScore / totalPossibleMarks) * 100).toFixed(2)) : 0;
      const status = percentage >= quiz.passing_score ? 'PASSED' : 'FAILED';

      let startTimeMs;
      if (typeof attempt.started_at === 'string') {
        let s = attempt.started_at.trim();
        if (!s.endsWith('Z') && !s.includes('+')) {
          s = s.replace(' ', 'T') + 'Z';
        }
        startTimeMs = new Date(s).getTime();
      } else {
        startTimeMs = new Date(attempt.started_at).getTime();
      }
      const endTimeMs = Date.now();
      let timeTakenSec = Math.max(1, Math.round((endTimeMs - startTimeMs) / 1000));
      // Cap at 2 hours max if timezone anomaly occurred on old records
      if (timeTakenSec > 19000 && timeTakenSec < 21000) {
        timeTakenSec = timeTakenSec - 19800; // subtract 5.5 hours UTC offset
        if (timeTakenSec < 1) timeTakenSec = 15;
      }

      db.prepare(`
        UPDATE attempts
        SET score = ?,
            total_marks = ?,
            percentage = ?,
            correct_answers = ?,
            incorrect_answers = ?,
            unanswered = ?,
            total_questions = ?,
            time_taken = ?,
            status = ?,
            completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(obtainedScore, totalPossibleMarks, percentage, correctCount, incorrectCount, unansweredCount, questions.length, timeTakenSec, status, attempt_id);

      return {
        attempt_id,
        score: obtainedScore,
        total_marks: totalPossibleMarks,
        percentage,
        correct_answers: correctCount,
        incorrect_answers: incorrectCount,
        unanswered: unansweredCount,
        total_questions: questions.length,
        time_taken: timeTakenSec,
        status,
        passing_score: quiz.passing_score,
        negative_marks_applied: negativeMarksPerQ > 0 ? (incorrectCount * negativeMarksPerQ) : 0
      };
    });

    const result = processTx();
    res.json(result);
  } catch (error) {
    console.error('Error submitting attempt:', error);
    res.status(500).json({ message: 'Error processing quiz submission' });
  }
};

// Get single attempt details & review breakdown [Student/Admin]
exports.getAttemptDetails = (req, res) => {
  try {
    const { id } = req.params;
    const attempt = db.prepare(`
      SELECT a.*, q.title as quiz_title, q.description as quiz_description, q.passing_score, q.negative_marks,
             c.name as category_name, u.name as student_name, u.email as student_email
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ?
    `).get(id);

    if (!attempt) {
      return res.status(404).json({ message: 'Attempt not found' });
    }

    if (req.user.role === 'STUDENT' && attempt.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied to this attempt result' });
    }

    const questions = db.prepare('SELECT * FROM questions WHERE quiz_id = ? ORDER BY id ASC').all(attempt.quiz_id);

    const detailedReview = questions.map(q => {
      const options = db.prepare('SELECT id, question_id, option_text, is_correct FROM options WHERE question_id = ?').all(q.id);
      const answerRecord = db.prepare('SELECT selected_option_id, user_text_answer, is_correct FROM answers WHERE attempt_id = ? AND question_id = ?').get(id, q.id);

      return {
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type || 'MCQ',
        explanation: q.explanation,
        marks: q.marks,
        options,
        selected_option_id: answerRecord ? answerRecord.selected_option_id : null,
        user_text_answer: answerRecord ? answerRecord.user_text_answer : null,
        is_correct: answerRecord ? answerRecord.is_correct === 1 : false
      };
    });

    res.json({ attempt, review: detailedReview });
  } catch (error) {
    console.error('Error fetching attempt details:', error);
    res.status(500).json({ message: 'Error fetching attempt details' });
  }
};

// Get attempts list (Student personal history or Admin all attempts)
exports.getAttempts = (req, res) => {
  try {
    const { userId, status, search } = req.query;
    const isAdmin = req.user.role === 'ADMIN';
    const filterUserId = isAdmin ? (userId || null) : req.user.id;

    let query = `
      SELECT a.*, q.title as quiz_title, c.name as category_name, u.name as student_name, u.email as student_email
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE a.completed_at IS NOT NULL
    `;
    const params = [];

    if (filterUserId) {
      query += ` AND a.user_id = ?`;
      params.push(filterUserId);
    }

    if (status && status !== 'ALL') {
      query += ` AND a.status = ?`;
      params.push(status);
    }

    if (search) {
      query += ` AND (u.name LIKE ? OR u.email LIKE ? OR q.title LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY a.completed_at DESC`;

    const attempts = db.prepare(query).all(...params);
    res.json(attempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ message: 'Error fetching attempt history' });
  }
};

// Verify Certificate by Certificate ID
exports.verifyCertificate = (req, res) => {
  try {
    const { certId } = req.params;
    let cleanId = certId.trim();
    if (cleanId.includes('-')) {
      const parts = cleanId.split('-');
      if (parts.length >= 3) {
        cleanId = parts[2];
      } else {
        cleanId = parts[parts.length - 1];
      }
    }
    cleanId = cleanId.replace(/[^0-9]/g, '');

    if (!cleanId) {
      return res.status(400).json({ valid: false, message: 'Invalid Certificate ID format' });
    }

    const attempt = db.prepare(`
      SELECT a.*, q.title as quiz_title, c.name as category_name, u.name as student_name, u.email as student_email
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      LEFT JOIN categories c ON q.category_id = c.id
      JOIN users u ON a.user_id = u.id
      WHERE a.id = ? AND a.completed_at IS NOT NULL
    `).get(cleanId);

    if (!attempt) {
      return res.status(404).json({ valid: false, message: 'Certificate record not found' });
    }

    res.json({
      valid: attempt.status === 'PASSED',
      certificate_code: `CERT-QM-${attempt.id}-${attempt.user_id}`,
      student_name: attempt.student_name,
      student_email: attempt.student_email,
      quiz_title: attempt.quiz_title,
      category_name: attempt.category_name,
      score_percentage: attempt.percentage,
      status: attempt.status,
      completed_at: attempt.completed_at
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ valid: false, message: 'Error processing certificate verification' });
  }
};

// Get Category Mastery stats for Skill Radar Chart
exports.getCategoryMastery = (req, res) => {
  try {
    const userId = req.user.id;
    const mastery = db.prepare(`
      SELECT c.name as category_name, AVG(a.percentage) as avg_percentage, COUNT(a.id) as attempt_count
      FROM attempts a
      JOIN quizzes q ON a.quiz_id = q.id
      JOIN categories c ON q.category_id = c.id
      WHERE a.user_id = ? AND a.completed_at IS NOT NULL
      GROUP BY c.id
    `).all(userId);

    const formatted = mastery.map(m => ({
      category: m.category_name,
      mastery: Math.round(m.avg_percentage || 0),
      attempts: m.attempt_count
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching category mastery:', error);
    res.status(500).json({ message: 'Error fetching skill mastery stats' });
  }
};
