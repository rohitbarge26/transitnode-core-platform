const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');

exports.getPendingInvoices = async (req, res) => {
  try {
    const invoices = await ShipmentLedger.find({ 
      status: 'PENDING',
      'accounting.paymentStatus': 'PENDING' 
    }).sort({ 'metadata.createdAt': -1 });
    
    res.status(200).json({ invoices });
  } catch (error) {
    console.error('Error fetching pending invoices:', error);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
};

exports.settleInvoice = async (req, res) => {
  try {
    const { trackingNumber } = req.params;
    const { baseRateApplied, subtotal, fuelSurcharge, gstAmount, grandTotal, paymentMethod } = req.body;

    // Validate that financial values are not negative
    if (subtotal < 0 || fuelSurcharge < 0 || gstAmount < 0 || grandTotal < 0) {
      return res.status(400).json({ message: 'Financial values cannot be negative' });
    }

    const shipment = await ShipmentLedger.findOne({ trackingNumber });
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    if (shipment.accounting.paymentStatus === 'PAID') {
      return res.status(400).json({ message: 'Invoice already settled' });
    }

    // Update the ledger document
    shipment.status = 'READY_FOR_DISPATCH';
    
    // Save base logic inside accounting
    shipment.accounting.accountantId = req.user?.id;
    shipment.accounting.baseRateApplied = baseRateApplied;
    shipment.accounting.subtotal = subtotal;
    
    // Add custom fuel surcharge into tax block or create new block
    // We will save it in tax along with gst for simplicity
    shipment.accounting.tax = {
      gstPercentage: 18,
      gstAmount: gstAmount,
      fuelSurcharge: fuelSurcharge // Mongoose allows adding unstructured fields if strict is false, or we just trust JS.
    };
    
    shipment.accounting.grandTotal = grandTotal;
    shipment.accounting.paymentStatus = 'PAID';
    // Mongoose allows adding dynamic fields if strict is false. If strict is true, this will just be ignored.
    shipment.accounting.paymentMethod = paymentMethod || 'SYSTEM'; 
    shipment.accounting.invoiceGeneratedAt = new Date();

    // Since we added fuelSurcharge and paymentMethod dynamically, let's mark modified to ensure save.
    shipment.markModified('accounting');
    await shipment.save();

    res.status(200).json({ message: 'Invoice settled successfully', shipment });
  } catch (error) {
    console.error('Error settling invoice:', error);
    res.status(500).json({ message: 'Server error settling invoice' });
  }
};
