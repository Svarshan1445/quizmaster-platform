const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, attemptController.getAttempts);
router.get('/mastery', authenticateToken, attemptController.getCategoryMastery);
router.get('/verify-certificate/:certId', attemptController.verifyCertificate);
router.get('/:id', authenticateToken, attemptController.getAttemptDetails);

module.exports = router;
