const mongoose = require('mongoose');

const rateCardSchema = new mongoose.Schema(
  {
    tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    type: {
      type: String,
      default: 'GLOBAL',
      unique: true,
      index: true,
    },
    basePricePerKg: {
      type: Number,
      required: true,
      default: 10, // Example default
    },
    volumetricDivisor: {
      type: Number,
      required: true,
      default: 5000,
    },
    fuelSurchargeRate: {
      type: Number, // Percentage e.g. 5 for 5%
      required: true,
      default: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('RateCard', rateCardSchema);
