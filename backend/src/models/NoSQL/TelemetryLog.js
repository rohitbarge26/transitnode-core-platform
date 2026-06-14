const mongoose = require('mongoose');

const telemetryLogSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true,
  },
  vehicleId: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['MOVING', 'STATIONARY'],
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  speed: {
    type: Number,
  },
  heading: {
    type: Number,
  },
  ignition: {
    type: Boolean,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Geospatial index for distance queries
telemetryLogSchema.index({ location: '2dsphere' });

// TTL index to automatically delete documents after 90 days (7776000 seconds)
telemetryLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('TelemetryLog', telemetryLogSchema);
