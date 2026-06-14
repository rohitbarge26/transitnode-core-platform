const mongoose = require('mongoose');

const tenantSchema = new mongoose.Schema(
  {
    companyName: {
      type: String,
      required: true,
    },
    registeredMobile: {
      type: String,
      required: true,
    },
    customSubdomain: {
      type: String,
      unique: true,
      index: true,
      required: true,
    },
    planType: {
      type: String,
      enum: ['TRIAL', 'SILVER', 'PLATINUM'],
      default: 'TRIAL',
    },
    licenseExpiresAt: {
      type: Date,
      required: true,
    },
    brandingOptions: {
      logoUrl: {
        type: String,
        default: null,
      },
      dominantHexColor: {
        type: String,
        default: '#3b82f6', // Default blue-500
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Tenant', tenantSchema);
