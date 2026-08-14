const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const { authenticateToken } = require('../middleware/auth');

// Get user unlocked badges (Protected)
router.get('/my-badges', authenticateToken, badgeController.getUserBadges);

module.exports = router;
