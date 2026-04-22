const mongoose = require('mongoose');

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  type: [{
    type: String,
    enum: [
      'SEO',
      'Google Ads',
      'Social Media Marketing',
      'Facebook Ads',
      'Content Marketing',
      'Graphic Design',
      'Website Design',
      'Custom'
    ]
  }],
  platforms: [{
    type: String,
    enum: ['WhatsApp', 'Instagram', 'Twitter', 'YouTube', 'LinkedIn', 'Facebook', 'Messenger']
  }],
  amount: {
    type: Number,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  durationUnit: {
    type: String,
    enum: ['days', 'weeks', 'months', 'years'],
    default: 'months'
  },
  deliverables: [{
    name: {
      type: String,
      required: true
    },
    monthlyCount: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  features: [String],
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client'
  },
  budget: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'On Hold', 'Cancelled'],
    default: 'Active'
  },
  startDate: Date,
  endDate: Date,
  assignedTeam: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Package', packageSchema);
