const mongoose = require('mongoose');

const taskHistorySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  assignedDate: {
    type: Date,
    required: true
  },
  dueDate: {
    type: Date,
    required: true
  },
  dueTime: {
    type: String,
    required: true
  },
  completedDate: {
    type: Date,
    default: Date.now
  },
  instructions: String,
  taskDetails: [String],
  referenceFiles: [{
    url: String,
    originalName: String,
    mimetype: String,
    description: String
  }],
  type: {
    type: String,
    enum: ['Post', 'Reel', 'Story', 'Design', 'Video', 'Writing', 'Other'],
    default: 'Other'
  },
  impactedDeliverables: [{
    name: String,
    count: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('TaskHistory', taskHistorySchema);
