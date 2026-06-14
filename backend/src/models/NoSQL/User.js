const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    username: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
    },
    mobileNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    password: {
      type: String,
      required: true,
    },
    name: {
      type: String,
    },
    role: {
      type: String,
      enum: ['RECEPTIONIST', 'ACCOUNTANT', 'ADMIN', 'DRIVER'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    driverProfile: {
      fullName: String,
      licenseNumber: {
        type: String,
        set: v => v ? v.replace(/[\s\W_]+/g, '').toUpperCase() : v,
        validate: {
          validator: function(v) {
            if (!v) return true; // Optional for non-drivers
            return /^[A-Z]{2}[0-9]{2}[0-9]{4}[0-9]{7}$/.test(v);
          },
          message: 'License number must match the standard 15-character Indian DL format (e.g., MH1220260089421).'
        }
      },
      licenseExpiryDate: Date,
      phoneNumber: String,
      assignedVehicle: String,
    },
    magicLinkToken: {
      type: String,
    },
    magicLinkExpires: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
