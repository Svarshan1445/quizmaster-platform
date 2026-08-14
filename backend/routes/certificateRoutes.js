const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificateController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Get or Issue Certificate for an attempt (Protected)
router.get('/attempt/:attemptId', authenticateToken, certificateController.getCertificateByAttempt);

// Public verification endpoint for QR code
router.get('/verify/:code', certificateController.verifyCertificate);

module.exports = router;
