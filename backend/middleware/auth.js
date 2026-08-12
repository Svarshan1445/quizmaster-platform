const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_quiz_master_key_2026';

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }

    // Verify user status in DB
    const dbUser = db.prepare('SELECT id, name, email, role, status FROM users WHERE id = ?').get(user.id);
    if (!dbUser) {
      return res.status(401).json({ message: 'User no longer exists' });
    }
    if (dbUser.status === 'INACTIVE') {
      return res.status(403).json({ message: 'Your account has been deactivated. Please contact Admin.' });
    }

    req.user = dbUser;
    next();
  });
}

// Middleware for Admin role authorization
function requireAdmin(req, res, next) {
  if (req.user && req.user.role === 'ADMIN') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
}

// Middleware for Student role authorization
function requireStudent(req, res, next) {
  if (req.user && (req.user.role === 'STUDENT' || req.user.role === 'ADMIN')) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Student access required' });
  }
}

module.exports = {
  JWT_SECRET,
  authenticateToken,
  requireAdmin,
  requireStudent
};
