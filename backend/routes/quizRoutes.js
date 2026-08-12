const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const attemptController = require('../controllers/attemptController');
const questionController = require('../controllers/questionController');
const { authenticateToken, requireAdmin, requireStudent } = require('../middleware/auth');

router.get('/', authenticateToken, quizController.getQuizzes);
router.get('/:id', authenticateToken, quizController.getQuizById);

// Admin Quiz Management
router.post('/', authenticateToken, requireAdmin, quizController.createQuiz);
router.put('/:id', authenticateToken, requireAdmin, quizController.updateQuiz);
router.patch('/:id/status', authenticateToken, requireAdmin, quizController.togglePublishStatus);
router.delete('/:id', authenticateToken, requireAdmin, quizController.deleteQuiz);

// Questions under Quiz
router.get('/:quizId/questions', authenticateToken, questionController.getQuestionsByQuiz);
router.post('/:quizId/questions', authenticateToken, requireAdmin, questionController.createQuestion);

// Student Quiz Attempt Runner
router.post('/:quizId/start', authenticateToken, requireStudent, attemptController.startAttempt);
router.post('/:quizId/submit', authenticateToken, requireStudent, attemptController.submitAttempt);

module.exports = router;
