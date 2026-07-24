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
    gstin: {
      type: String,
    },
    pan: {
      type: String,
    },
    address: {
      type: String,
    },
    state: {
      type: String,
    },
    stateCode: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    fullLoginUrl: {
      type: String,
    },
    planType: {
      type: String,
      enum: ['TRIAL', 'SILVER', 'PLATINUM', 'LIFETIME'],
      default: 'TRIAL',
    },
    licenseExpiresAt: {
      type: Date,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID'],
      default: 'PENDING',
    },
    adminSetupComplete: {
      type: Boolean,
      default: false,
    },
    maxCompaniesAllowed: {
      type: Number,
      default: 1,
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
    requireDriverMobileApp: {
      type: Boolean,
      default: false,
    },
    customInvoiceTemplateUrl: {
      type: String,
      default: null,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    hasUsedTrial: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hook removed as per user request

module.exports = mongoose.model('Tenant', tenantSchema);
