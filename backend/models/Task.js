const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: false
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: false
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  type: {
    type: String,
    enum: ['Post', 'Reel', 'Story', 'Design', 'Video', 'Writing', 'Other'],
    default: 'Other'
  },
  platform: {
    type: String,
    enum: ['Instagram', 'Facebook', 'LinkedIn', 'Twitter', 'TikTok', 'Internal'],
    default: 'Instagram'
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Review', 'Completed', 'On Hold'],
    default: 'Pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  dueTime: {
    type: String,
    required: true,
    default: '09:00'
  },
  startDate: Date,
  attachments: [String],
  referenceFiles: [{
    url: String,
    originalName: String,
    mimetype: String,
    description: String
  }],
  instructions: String,
  taskDetails: [String],
  feedback: String,
  notificationSent: {
    type: Boolean,
    default: false
  },
  reminderScheduled: {
    type: Boolean,
    default: false
  },
  remindersSent: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  impactedDeliverables: [{
    name: String,
    count: { type: Number, default: 0 }
  }],
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Task', taskSchema);
