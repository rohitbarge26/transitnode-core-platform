const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');

const mongoose = require('mongoose');

exports.getTrialBalance = async (req, res) => {
  try {
    if (!req.user.tenantId) {
      return res.status(401).json({ success: false, message: 'Invalid session: Missing tenant ID. Please log out and log back in.' });
    }
    const tenantMatch = { tenantId: new mongoose.Types.ObjectId(req.user.tenantId) };
    
    // A simplified Trial Balance aggregation
    const result = await ShipmentLedger.aggregate([
      { $match: tenantMatch },
      {
        $group: {
          _id: null,
          totalAccountsReceivable: {
            $sum: {
              $cond: [{ $eq: ['$accounting.paymentStatus', 'PENDING'] }, '$accounting.grandTotal', 0],
            },
          },
          totalCashBank: {
            $sum: {
              $cond: [{ $eq: ['$accounting.paymentStatus', 'PAID'] }, '$accounting.grandTotal', 0],
            },
          },
          totalFreightIncome: { $sum: '$accounting.subtotal' },
          totalDriverAdvances: { $sum: '$accounting.driverAdvanceCash' },
          totalFuelExpenses: { $sum: '$accounting.fuelVoucherAmount' },
          totalTollExpenses: { $sum: '$accounting.tollAllowance' },
          totalGSTCollected: { $sum: '$accounting.tax.gstAmount' },
        },
      },
    ]);

    if (result.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }

    const data = result[0];
    
    // Split GST roughly into CGST/SGST (assuming standard 18% intra-state for simplicity)
    const gstHalf = (data.totalGSTCollected || 0) / 2;

    const trialBalance = [
      { account: 'Accounts Receivable', debit: data.totalAccountsReceivable, credit: 0 },
      { account: 'Cash/Bank Accounts', debit: data.totalCashBank, credit: 0 },
      { account: 'Driver Advances (Assets)', debit: data.totalDriverAdvances, credit: 0 },
      { account: 'Fuel Expenses', debit: data.totalFuelExpenses, credit: 0 },
      { account: 'Toll Expenses', debit: data.totalTollExpenses, credit: 0 },
      { account: 'Freight Income', debit: 0, credit: data.totalFreightIncome },
      { account: 'CGST Payable', debit: 0, credit: gstHalf },
      { account: 'SGST Payable', debit: 0, credit: gstHalf },
    ];

    res.status(200).json({ success: true, data: trialBalance });
  } catch (error) {
    console.error('Error fetching Trial Balance:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getPnL = async (req, res) => {
  try {
    const tenantMatch = { tenantId: new mongoose.Types.ObjectId(req.user.tenantId) };
    
    const result = await ShipmentLedger.aggregate([
      { $match: tenantMatch },
      {
        $group: {
          _id: null,
          revenue: { $sum: '$accounting.subtotal' },
          fuelExpenses: { $sum: '$accounting.fuelVoucherAmount' },
          tollExpenses: { $sum: '$accounting.tollAllowance' },
          driverAdvances: { $sum: '$accounting.driverAdvanceCash' }, // Asset, not expense
        },
      },
    ]);

    const Payroll = require('../models/NoSQL/Payroll');
    const payrollAgg = await Payroll.aggregate([
      { $match: tenantMatch },
      {
        $group: {
          _id: null,
          totalBaseSalary: { $sum: '$baseSalary' }
        }
      }
    ]);
    const totalPayroll = payrollAgg.length > 0 ? payrollAgg[0].totalBaseSalary : 0;

    if (result.length === 0) {
      return res.status(200).json({ success: true, data: {} });
    }

    const data = result[0];
    // Driver advances are recouped through payroll, so the actual expense to the company is the Payroll (Gross Salary).
    const totalExpenses = data.fuelExpenses + data.tollExpenses + totalPayroll;
    const netProfit = data.revenue - totalExpenses;

    const pnl = {
      revenue: data.revenue,
      expenses: {
        fuel: data.fuelExpenses,
        toll: data.tollExpenses,
        payroll: totalPayroll,
        driverAdvances: data.driverAdvances, // Kept for reference, but not in total expenses
        total: totalExpenses
      },
      netProfit: netProfit
    };

    res.status(200).json({ success: true, data: pnl });
  } catch (error) {
    console.error('Error fetching P&L:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getTripDetails = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const trip = await ShipmentLedger.findOne({ trackingNumber, tenantId: req.user.tenantId });
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    res.status(200).json({ success: true, data: trip });
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
