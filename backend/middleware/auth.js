const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Team = require('../models/Team');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;

    // Compatibility with existing code using req.admin
    if (req.userRole !== 'Team Member') {
      const admin = await Admin.findById(decoded.id);
      if (!admin || !admin.isActive) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      req.admin = admin;
    } else {
      req.admin = { _id: decoded.id, role: 'Team Member' };
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
};

const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    const userRole = req.userRole || req.admin?.role;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
};

module.exports = {
  authMiddleware,
  roleMiddleware
};
