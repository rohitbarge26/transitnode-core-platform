const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  employeeId: {
    type: String,
    required: true,
    index: true,
  },
  employeeName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['DRIVER', 'STAFF', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST'],
    required: true,
  },
  paymentMonth: {
    type: String, // e.g. "2026-05"
    required: true,
    index: true,
  },
  baseSalary: {
    type: Number,
    required: true,
    min: 0,
  },
  totalAdvances: {
    type: Number,
    default: 0,
    min: 0,
  },
  netPay: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['PENDING', 'PAID'],
    default: 'PENDING',
  },
  processedAt: {
    type: Date,
    default: Date.now,
  },
  paidAt: {
    type: Date,
  },
});

// Compound index for quick lookups per employee per month
payrollSchema.index({ employeeId: 1, paymentMonth: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
