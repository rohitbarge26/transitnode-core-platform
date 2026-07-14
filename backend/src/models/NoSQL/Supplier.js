const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    supplierName: {
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
    },
    locationCode: {
      type: String,
    },
    identifierType: {
      type: String,
      default: '',
    },
    mobileNumber: {
      type: String,
    },
    emailId: {
      type: String,
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
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Supplier', supplierSchema);
