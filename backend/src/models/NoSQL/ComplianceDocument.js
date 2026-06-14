const mongoose = require('mongoose');

const complianceDocumentSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    targetType: {
      type: String,
      enum: ['VEHICLE', 'DRIVER', 'EMPLOYEE'],
      required: true
    },
    targetId: {
      type: String,
      required: true
    },
    documentType: {
      type: String,
      enum: ['INSURANCE', 'DL', 'NATIONAL_PERMIT', 'PUC', 'FUEL_TOLL_SLIP', 'AADHAAR', 'PAN', 'ADDRESS_PROOF'],
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Create compound index for fast lookups
complianceDocumentSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model('ComplianceDocument', complianceDocumentSchema);
