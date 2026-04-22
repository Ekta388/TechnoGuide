const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  deliverablesProgress: [{
    name: String,
    completedCount: { type: Number, default: 0 },
    total: Number,
    monthlyCount: Number
  }]
});

module.exports = mongoose.model('Assignment', assignmentSchema);
