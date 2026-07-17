const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes (JWT validation)
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'User not found associated with this token' });
    }
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    return res.status(401).json({ success: false, message: 'Not authorized, token verification failed' });
  }
};

// Middleware to enforce user roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role ${req.user ? req.user.role : 'Guest'} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
