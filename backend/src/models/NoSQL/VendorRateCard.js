const mongoose = require('mongoose');

const vendorRateCardSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    vendorName: { type: String, required: true },
    vehicleType: { type: String, required: true },
    baseRate: { type: Number, default: 0 },
    tollCharge: { type: Number, default: 0 },
    dcmCharge: { type: Number, default: 0 },
    totalRate: { type: Number, default: 0 },
    vehicleDetails: { type: String, default: '' },
    vehicleDocumentUrl: { type: String, default: null },
    driverName: { type: String, default: '' },
    driverLicenseDocumentUrl: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VendorRateCard', vendorRateCardSchema);
