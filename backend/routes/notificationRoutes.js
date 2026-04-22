const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Protected admin routes
const adminAuth = [authMiddleware, roleMiddleware(['Super Admin', 'Admin'])];

router.get('/', ...adminAuth, notificationController.getAllNotifications);
router.get('/stats', ...adminAuth, notificationController.getNotificationStats);
router.patch('/:id/read', ...adminAuth, notificationController.markAsRead);
router.patch('/:id/status', ...adminAuth, notificationController.updateStatus);
router.post('/:id/retry', ...adminAuth, notificationController.retryNotification);
router.post('/manual', ...adminAuth, notificationController.sendManualNotification);

module.exports = router;
