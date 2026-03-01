const mongoose = require('mongoose');

const neoSchema = new mongoose.Schema({
  neoId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  isPotentiallyHazardous: Boolean,
  estimatedDiameter: {
    min: Number,
    max: Number,
    unit: String
  },
  closeApproachDates: [{
    date: Date,
    relativeVelocity: {
      kmPerSecond: Number,
      kmPerHour: Number,
      milesPerHour: Number
    },
    missDistance: {
      astronomical: Number,
      km: Number,
      miles: Number
    },
    orbitingBody: String
  }],
  absoluteMagnitude: Number,
  riskScore: {
    type: Number,
    default: 0
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW'
  },
  nasaUrl: String,
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('NEO', neoSchema);
