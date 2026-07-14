const mongoose = require('mongoose');

const shipmentLedgerSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null },
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
        company: { type: String },
        name: { type: String },
        phone: { type: String },
        address: { type: String },
        gstin: { type: String },
        postalCode: { type: String },
        dropOff: { type: Boolean, default: false }
      },
      receiver: {
        name: { type: String },
        phone: { type: String },
        address: { type: String },
        gstin: { type: String },
        postalCode: { type: String },
        selfCollect: { type: Boolean, default: false },
        clientCode: { type: String }
      },
      package: {
        weight_kg: { type: Number, min: 0 },
        dimensions: { type: String }, // e.g. "10x20x30" or "#Boxes x Dimension"
        actualWeight: { type: Number, min: 0 },
        chargedWeight: { type: Number, min: 0 },
        packingType: { type: String },
        fragile: { type: Boolean, default: false },
        invoiceNo: { type: String },
        invoiceDate: { type: Date },
        invoiceValue: { type: Number, min: 0 },
        ewayBillNo: { type: String },
        riskCoverage: { type: String, enum: ['OWNERS', 'CARRIERS'], default: 'OWNERS' }
      },
      transport: {
        vehicleNumber: { type: String },
        parentVehicleNumber: { type: String },
        vehicleType: { type: String },
        driverName: { type: String },
        driverPhone: { type: String },
        origin: { type: String },
        destination: { type: String },
        destinationCoords: { type: String },
        commodityType: { type: String },
      },
    },
    accounting: {
      accountantId: { type: String },
      billingCycle: { type: String, enum: ['DAILY', 'MONTHLY'], default: 'DAILY' },
      baseRateApplied: { type: Number, min: 0 },
      driverAdvanceCash: { type: Number, min: 0, default: 0 },
      fuelVoucherAmount: { type: Number, min: 0, default: 0 },
      tollAllowance: { type: Number, min: 0, default: 0 },
      processingCharge: { type: Number, default: 0 },
      fuelSurcharge: { type: Number, default: 0 },
      rovCharge: { type: Number, default: 0 },
      fodCharge: { type: Number, default: 0 },
      handlingCharge: { type: Number, default: 0 },
      codDodCharge: { type: Number, default: 0 },
      specialDeliveryCharge: { type: Number, default: 0 },
      otherCharges: { type: Number, default: 0 },
      paymentType: { type: String, enum: ['CREDIT', 'PAID', 'FOD'], default: 'CREDIT' },
      modeOfPayment: { type: String, enum: ['CASH', 'CHEQUE_DD', 'NEFT_RTGS'], default: 'NEFT_RTGS' },
      chequeNeftNo: { type: String },
      bankName: { type: String },
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
      consolidatedInvoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ConsolidatedInvoice' },
      portalStatus: { type: String, enum: ['NOT_UPLOADED', 'UPLOADED', 'DISPUTED'], default: 'NOT_UPLOADED' },
      portalRefId: { type: String },
      portalUploadedAt: { type: Date },
    },
    lrCopyUrl: { type: String },
    podStatus: { 
      type: String, 
      enum: ['PENDING', 'COLLECTED', 'VERIFIED'], 
      default: 'PENDING' 
    },
    // Coordinate tracking & Geofence
    destinationLat: { type: Number, required: true },
    destinationLng: { type: Number, required: true },
    geofenceBreached: { type: Boolean, default: false },
    gateVerificationOTP: { type: String },
    otpGeneratedAt: { type: Date },
    exceptions: [
      {
        issueType: { type: String },
        description: { type: String },
        reportedAt: { type: Date, default: Date.now },
        status: { type: String, enum: ['OPEN', 'RESOLVED'], default: 'OPEN' }
      }
    ],
  },
  {
    // Disable automatic timestamps since we are handling them in the metadata block
    timestamps: false, 
  }
);

// Compound index
shipmentLedgerSchema.index({ trackingNumber: 1, 'metadata.createdAt': -1 });

// Pre-validate hook to parse destinationCoords to destinationLat/destinationLng and handle legacy/missing data
shipmentLedgerSchema.pre('validate', function (next) {
  if (this.destinationLat === undefined || this.destinationLat === null || this.destinationLng === undefined || this.destinationLng === null) {
    const coordsStr = this.logistics?.transport?.destinationCoords;
    if (coordsStr && coordsStr.includes(',')) {
      const [latStr, lngStr] = coordsStr.split(',');
      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      if (!isNaN(lat) && !isNaN(lng)) {
        this.destinationLat = lat;
        this.destinationLng = lng;
      }
    }
  }

  // Final fallback to prevent validation errors for legacy data
  if (this.destinationLat === undefined || this.destinationLat === null) {
    this.destinationLat = 19.0760;
  }
  if (this.destinationLng === undefined || this.destinationLng === null) {
    this.destinationLng = 72.8777;
  }
  next();
});

// Pre-save hook to update the updated_at metadata
shipmentLedgerSchema.pre('save', function (next) {
  this.metadata.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('ShipmentLedger', shipmentLedgerSchema);
