const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    companyName: {
      type: String,
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
      required: true,
    },
    identifierType: {
      type: String,
      default: ''
    },
    supportedBillingCycles: [
      {
        type: String,
      },
    ],
    supportedInvoiceTypes: [
      {
        type: String,
      },
    ],
    state: {
      type: String,
    },
    stateCode: {
      type: String,
    },
    contactNumber: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    customInvoiceTemplateUrl: {
      type: String,
      default: null,
    },
    invoiceTemplateType: {
      type: String,
      enum: ['TAX_INVOICE', 'BILL_OF_SUPPLY', 'SIMPLIFIED_3_COL'],
      default: 'TAX_INVOICE',
    },
    requireDriverMobileApp: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Company', companySchema);
