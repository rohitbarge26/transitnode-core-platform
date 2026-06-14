const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');

exports.createShipment = async (req, res) => {
  try {
    const { 
      senderName, senderPhone, receiverName, receiverPhone, weight_kg, dimensions,
      vehicleNumber, vehicleType, driverName, driverPhone, origin, destination, commodityType 
    } = req.body;
    
    // Generate TR-YYYY-XXXXX tracking ID
    const trackingNumber = 'TR-' + new Date().getFullYear() + '-' + Math.floor(10000 + Math.random() * 90000);
    
    // Base estimation logic
    const baseRateApplied = 5000; // Flat transport rate default
    const subtotal = baseRateApplied;
    
    const newShipment = await ShipmentLedger.create({
      tenantId: req.user.tenantId,
      trackingNumber,
      status: 'PENDING',
      metadata: {
        receptionistId: req.user?.id
      },
      logistics: {
        sender: { name: senderName, phone: senderPhone },
        receiver: { name: receiverName, phone: receiverPhone },
        package: { weight_kg, dimensions },
        transport: {
          vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase() : undefined,
          vehicleType,
          driverName,
          driverPhone,
          origin,
          destination,
          commodityType
        }
      },
      accounting: {
        baseRateApplied,
        subtotal
      }
    });

    // Mark the assigned Driver and Vehicle as ON_TRIP
    if (driverPhone) {
      const Driver = require('../models/NoSQL/Driver');
      await Driver.findOneAndUpdate({ phone: driverPhone }, { status: 'ON_TRIP' });
    }
    
    if (vehicleNumber) {
      const Device = require('../models/NoSQL/Device');
      await Device.findOneAndUpdate({ vehicleRegistration: vehicleNumber.toUpperCase() }, { status: 'ON_TRIP' });
    }

    res.status(201).json({ message: 'Shipment created', shipment: newShipment });
  } catch (error) {
    console.error('Error creating shipment:', error);
    res.status(500).json({ message: 'Server error creating shipment' });
  }
};

exports.listShipments = async (req, res) => {
  try {
    const { timeRange } = req.query;
    let query = {};
    const now = new Date();

    if (timeRange && timeRange !== 'all') {
      let startDate = new Date();
      if (timeRange === 'day') {
        startDate.setDate(now.getDate() - 1);
      } else if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === '6month') {
        startDate.setMonth(now.getMonth() - 6);
      } else if (timeRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
      }
      query['metadata.createdAt'] = { $gte: startDate };
    }

    const limitCount = timeRange === 'all' ? 100 : 500;
    query.tenantId = req.user.tenantId;
    const shipments = await ShipmentLedger.find(query).sort({ 'metadata.createdAt': -1 }).limit(limitCount);
    res.status(200).json({ shipments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching shipments' });
  }
};

exports.getShipment = async (req, res) => {
  try {
    const { trackingId } = req.params;
    // Public endpoint: trackingNumber is globally unique, no tenantId required
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
    const activeShipments = await ShipmentLedger.countDocuments({ status: { $ne: 'DELIVERED' }, tenantId: req.user.tenantId });
    const pendingInvoices = await ShipmentLedger.countDocuments({ 'accounting.paymentStatus': 'PENDING', tenantId: req.user.tenantId });
    
    res.status(200).json({ activeShipments, pendingInvoices });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
};

exports.getPendingInvoices = async (req, res) => {
  try {
    const invoices = await ShipmentLedger.find({ 'accounting.paymentStatus': 'PENDING', tenantId: req.user.tenantId }).sort({ 'metadata.createdAt': -1 });
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
    
    const shipment = await ShipmentLedger.findOne({ trackingNumber: trackingId, tenantId: req.user.tenantId });
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
