const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Auth routes
router.get('/test', (req, res) => res.json({ message: 'Auth routes active' }));
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/login-team', authController.teamLogin);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);
router.post('/change-password', authMiddleware, authController.changePassword);

module.exports = router;
