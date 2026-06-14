const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    imei: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    vehicleRegistration: {
      type: String,
      required: true,
      unique: true,
    },
    vehicleType: {
      type: String,
      required: true,
      default: 'Container'
    },
    driverName: {
      type: String,
      required: true,
    },
    driverPhone: {
      type: String,
    },
    fitnessExpiry: {
      type: Date
    },
    status: {
      type: String,
      enum: ['YARD', 'ON_TRIP', 'MAINTENANCE', 'ACTIVE', 'INACTIVE'], // Keep ACTIVE/INACTIVE for backwards compatibility just in case
      default: 'YARD',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Device', deviceSchema);
