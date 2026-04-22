const Notification = require('../models/Notification');

// Get all notifications with filters
exports.getAllNotifications = async (req, res) => {
  try {
    const { type, status, startDate, endDate } = req.query;
    let query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate('recipient', 'name role')
      .populate('metadata.taskId', 'title')
      .populate('metadata.clientId', 'name')
      .populate('metadata.packageId', 'name');

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get notification stats
exports.getNotificationStats = async (req, res) => {
  try {
    const total = await Notification.countDocuments();
    const sent = await Notification.countDocuments({ status: 'Sent' });
    const failed = await Notification.countDocuments({ status: 'Failed' });
    const pending = await Notification.countDocuments({ status: 'Pending' });

    // Last 24h stats
    const last24h = await Notification.countDocuments({
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    res.json({
      total,
      sent,
      failed,
      pending,
      last24h
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark as read
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { readStatus: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Retry failed notification
exports.retryNotification = async (req, res) => {
  try {
    console.log(`[Retry] Attempting to retry notification: ${req.params.id}`);
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      console.log(`[Retry] Notification not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Notification not found' });
    }

    if (!notification.recipientEmail) {
      // Try to get email from team member if it's missing in notification
      const Team = require('../models/Team');
      const recipient = await Team.findById(notification.recipient);
      if (recipient && recipient.email) {
        notification.recipientEmail = recipient.email;
      } else {
        console.log(`[Retry] Missing recipientEmail for notification: ${notification._id}`);
        return res.status(400).json({ message: 'Recipient email address is missing' });
      }
    }

    const emailService = require('../services/emailService');

    // Explicitly set credentials to ensure they are used (as per user request)
    emailService.user = 'ektarana388@gmail.com';
    emailService.pass = 'qwlv ohhw ziuz yhjw';

    console.log(`[Retry] Sending email to ${notification.recipientEmail}`);
    const subject = `Resending: ${notification.type}`;
    const result = await emailService.sendEmail(notification.recipientEmail, subject, notification.message);

    console.log(`[Retry] Result: ${result.success ? 'Success' : 'Failed'}`);

    notification.status = result.success ? 'Sent' : 'Failed';
    if (!result.success) {
      notification.error = result.error;
    } else {
      notification.error = null;
    }

    await notification.save();
    res.json({ success: result.success, message: result.success ? 'Retried successfully' : 'Retry failed', error: notification.error });
  } catch (error) {
    console.error(`[Retry] Critical Error:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Send manual notification for a task
exports.sendManualNotification = async (req, res) => {
  try {
    const { taskId } = req.body;
    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required' });
    }

    console.log(`[Manual Notification] Triggered for task: ${taskId}`);
    const notificationService = require('../services/notificationService');

    // Ensure email credentials for the service
    const emailService = require('../services/emailService');
    emailService.user = 'ektarana388@gmail.com';
    emailService.pass = 'qwlv ohhw ziuz yhjw';

    const notification = await notificationService.notifyTaskAssignment(taskId, true);

    if (!notification) {
      return res.status(404).json({ message: 'Task not found or recipient missing phone number' });
    }

    res.json({
      success: notification.status === 'Sent',
      message: notification.status === 'Sent' ? 'Notification sent successfully' : 'Notification failed to send',
      notification
    });
  } catch (error) {
    console.error(`[Manual Notification] Error:`, error);
    res.status(500).json({ message: error.message });
  }
};

// Update status
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ message: 'Status is required' });

    await Notification.findByIdAndUpdate(req.params.id, { status });
    res.json({ message: `Notification status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
