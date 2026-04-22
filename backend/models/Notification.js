const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Task Assignment', 'Task Reminder', 'Daily Summary', 'Package Alert', 'Overdue Alert', 'System Alert', 'Unassigned Alert', 'Message', 'Alert'],
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false
  },
  recipientPhone: {
    type: String,
    required: false
  },
  recipientEmail: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['Sent', 'Failed', 'Pending'],
    default: 'Pending'
  },
  error: {
    type: String
  },
  readStatus: {
    type: Boolean,
    default: false
  },
  metadata: {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Package' }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Notification', notificationSchema);
