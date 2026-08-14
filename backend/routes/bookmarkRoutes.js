const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const { authenticateToken } = require('../middleware/auth');

router.post('/toggle', authenticateToken, bookmarkController.toggleBookmark);
router.get('/my-bookmarks', authenticateToken, bookmarkController.getUserBookmarks);

module.exports = router;
