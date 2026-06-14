const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      set: v => v ? v.replace(/[\s\W_]+/g, '').toUpperCase() : v,
      validate: {
        validator: function(v) {
          return /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(v);
        },
        message: 'License number must match the standard 15-character Indian DL format (e.g., MH1220260089421).'
      }
    },
    licenseExpiryDate: {
      type: Date,
      required: true
    },
    status: {
      type: String,
      enum: ['AVAILABLE', 'ON_TRIP', 'INACTIVE'],
      default: 'AVAILABLE',
    },
    assignedVehicle: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Driver', driverSchema);
