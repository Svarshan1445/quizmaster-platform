const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.get('/stats', authenticateToken, requireAdmin, analyticsController.getAdminStats);
router.get('/charts', authenticateToken, requireAdmin, analyticsController.getAdminAnalytics);

module.exports = router;
