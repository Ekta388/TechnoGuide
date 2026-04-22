const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  address: {
    type: String
  },
  role: {
    type: String,
    enum: ['Manager', 'Designer', 'Videographer', 'Content Writer', 'Social Media Executive', 'Developer'],
    required: true
  },
  experience: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Team', teamSchema);
