const mongoose = require('mongoose');

const dailyRunSheetSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    date: { type: String, required: true },
    sourceHubName: { type: String },
    vendor: { type: String }, // Client Name
    supplier: { type: String }, // Supplier Name
    movementType: { type: String },
    vehicleNumber: { type: String, required: true },
    vehicleType: { type: String },
    parentVehicleNumber: { type: String },
    transport: { type: String }, // Vendor Name (Text field)
    billingCycleUsed: { type: String },
    invoiceTypeUsed: { type: String },
    vehicleOwnershipType: { type: String, default: 'Adhoc' },
    driverType: { type: String, default: 'Contract' },
    startOdometer: { type: Number, default: 0 },
    endOdometer: { type: Number, default: 0 },
    distanceTravelled: { type: Number, default: 0 },
    freight: { type: Number, default: 0 },
    dcmCharges: { type: Number, default: 0 },
    tollAmt: { type: Number, default: 0 },
    totalAmt: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DailyRunSheet', dailyRunSheetSchema);
