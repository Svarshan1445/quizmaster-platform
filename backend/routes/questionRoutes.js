const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.put('/:id', authenticateToken, requireAdmin, questionController.updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, questionController.deleteQuestion);

module.exports = router;
