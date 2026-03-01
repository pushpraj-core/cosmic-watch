const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  neoId: String,
  neoName: String,
  alertType: {
    type: String,
    enum: ['CLOSE_APPROACH', 'HAZARDOUS_STATUS', 'MILESTONE_EVENT'],
    required: true
  },
  message: String,
  eventDate: Date,
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  sentAt: Date
});

module.exports = mongoose.model('Alert', alertSchema);
