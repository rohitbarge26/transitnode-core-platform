const mongoose = require('mongoose');

const shipmentLedgerSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    trackingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    publicTrackingToken: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'],
      default: 'PENDING',
    },
    metadata: {
      receptionistId: { type: String },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      closedAt: { type: Date },
    },
    logistics: {
      sender: {
        name: { type: String },
        phone: { type: String },
      },
      receiver: {
        name: { type: String },
        phone: { type: String },
      },
      package: {
        weight_kg: { type: Number, min: 0 },
        dimensions: { type: String }, // e.g. "10x20x30"
      },
      transport: {
        vehicleNumber: { type: String },
        vehicleType: { type: String },
        driverName: { type: String },
        driverPhone: { type: String },
        origin: { type: String },
        destination: { type: String },
        commodityType: { type: String },
      },
    },
    accounting: {
      accountantId: { type: String },
      baseRateApplied: { type: Number, min: 0 },
      driverAdvanceCash: { type: Number, min: 0, default: 0 },
      fuelVoucherAmount: { type: Number, min: 0, default: 0 },
      tollAllowance: { type: Number, min: 0, default: 0 },
      subtotal: { type: Number, min: 0 },
      tax: {
        gstPercentage: { type: Number, min: 0 },
        gstAmount: { type: Number, min: 0 },
        rcmApplied: { type: Boolean, default: false }
      },
      grandTotal: { type: Number, min: 0 },
      paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID'],
        default: 'PENDING',
      },
      paymentMethod: { type: String },
      invoiceGeneratedAt: { type: Date },
      generatedDeliveryOtp: { type: String },
    },
  },
  {
    // Disable automatic timestamps since we are handling them in the metadata block
    timestamps: false, 
  }
);

// Compound index
shipmentLedgerSchema.index({ trackingNumber: 1, 'metadata.createdAt': -1 });

// Pre-save hook to update the updated_at metadata
shipmentLedgerSchema.pre('save', function (next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ShipmentLedger', shipmentLedgerSchema);
