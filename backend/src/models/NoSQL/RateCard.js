const mongoose = require('mongoose');

const rateCardSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
    type: {
      type: String,
      default: 'GLOBAL',
      index: true,
    },
    templateType: {
      type: String,
      enum: ['TEMPLATE_A', 'TEMPLATE_B', 'TEMPLATE_C'],
      default: 'TEMPLATE_C',
      required: true,
    },
    rows: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    basePricePerKg: {
      type: Number,
      default: 10,
    },
    volumetricDivisor: {
      type: Number,
      default: 5000,
    },
    fuelSurchargeRate: {
      type: Number, // Percentage e.g. 5 for 5%
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RateCard', rateCardSchema);
