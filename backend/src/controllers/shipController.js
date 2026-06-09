const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');

exports.createShipment = async (req, res) => {
  try {
    const { senderName, senderPhone, receiverName, receiverPhone, weight_kg, dimensions } = req.body;
    
    // Generate TN-YYYY-XXXXX tracking ID
    const trackingNumber = 'TN-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    
    // Base estimation logic
    const baseRateApplied = 5.5; // Example: $5.50 per kg
    const subtotal = (weight_kg || 1) * baseRateApplied;
    
    const newShipment = await ShipmentLedger.create({
      trackingNumber,
      status: 'PENDING',
      metadata: {
        receptionistId: req.user?.id
      },
      logistics: {
        sender: { name: senderName, phone: senderPhone },
        receiver: { name: receiverName, phone: receiverPhone },
        package: { weight_kg, dimensions }
      },
      accounting: {
        baseRateApplied,
        subtotal
      }
    });

    res.status(201).json({ message: 'Shipment created', shipment: newShipment });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: 'Server error creating shipment' });
  }
};

exports.listShipments = async (req, res) => {
  try {
    const shipments = await ShipmentLedger.find().sort({ 'metadata.createdAt': -1 }).limit(50);
    res.status(200).json({ shipments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching shipments' });
  }
};

exports.getShipment = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const shipment = await ShipmentLedger.findOne({ trackingNumber: trackingId });
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    
    res.status(200).json({ shipment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching shipment details' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const activeShipments = await ShipmentLedger.countDocuments({ status: { $ne: 'DELIVERED' } });
    const pendingInvoices = await ShipmentLedger.countDocuments({ 'accounting.paymentStatus': 'PENDING' });
    
    res.status(200).json({ activeShipments, pendingInvoices });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
};

exports.getPendingInvoices = async (req, res) => {
  try {
    const invoices = await ShipmentLedger.find({ 'accounting.paymentStatus': 'PENDING' }).sort({ 'metadata.createdAt': -1 });
    res.status(200).json({ invoices });
  } catch (error) {
    console.error('Error fetching pending invoices:', error);
    res.status(500).json({ message: 'Server error fetching invoices' });
  }
};

exports.processPayment = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { gstPercentage } = req.body;
    
    const shipment = await ShipmentLedger.findOne({ trackingNumber: trackingId });
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });
    if (shipment.accounting.paymentStatus === 'PAID') {
      return res.status(400).json({ message: 'Shipment is already paid' });
    }
    
    const subtotal = shipment.accounting.subtotal || 0;
    const gstAmount = subtotal * (gstPercentage / 100);
    const grandTotal = subtotal + gstAmount;
    
    shipment.accounting.accountantId = req.user?.id;
    shipment.accounting.tax = { gstPercentage, gstAmount };
    shipment.accounting.grandTotal = grandTotal;
    shipment.accounting.paymentStatus = 'PAID';
    shipment.accounting.invoiceGeneratedAt = new Date();
    shipment.status = 'READY_FOR_DISPATCH';
    
    await shipment.save();
    
    res.status(200).json({ message: 'Payment processed successfully', shipment });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ message: 'Server error processing payment' });
  }
};
