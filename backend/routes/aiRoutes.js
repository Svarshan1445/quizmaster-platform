const express = require('express');
const router = express.Router();
const { generateQuestions } = require('../controllers/aiController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.post('/generate-questions', authenticateToken, requireAdmin, generateQuestions);

module.exports = router;
