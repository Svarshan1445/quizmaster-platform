const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin, requireStudent } = require('../middleware/auth');

// Admin User Management
router.get('/', authenticateToken, requireAdmin, userController.getUsers);
router.patch('/:id/status', authenticateToken, requireAdmin, userController.updateUserStatus);
router.delete('/:id', authenticateToken, requireAdmin, userController.deleteUser);

// Student Dashboard Overview
router.get('/student/dashboard', authenticateToken, requireStudent, userController.getStudentDashboard);

// Student Performance Chart
router.get('/student/performance', authenticateToken, requireStudent, userController.getPerformanceChart);

// Student Profile Update
router.put('/profile', authenticateToken, userController.updateProfile);
router.put('/change-password', authenticateToken, userController.changePassword);

module.exports = router;
