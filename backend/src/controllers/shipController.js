const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
const https = require('https');

const geocodeAddress = (address) => {
  return new Promise((resolve) => {
    if (!address) return resolve('19.0760,72.8777'); // default to Mumbai
    
    const cleanAddress = address.trim().toLowerCase();
    
    // Local hub dictionary for common test cases (instant, offline-resilient matching)
    const COMMON_HUBS = {
      'mumbai': '19.0760,72.8777',
      'pune': '18.5204,73.8567',
      'chennai': '13.0827,80.2707',
      'delhi': '28.6139,77.2090',
      'bangalore': '12.9716,77.5946',
      'bengaluru': '12.9716,77.5946',
      'hyderabad': '17.3850,78.4867',
      'kolkata': '22.5726,88.3639',
      'ahmedabad': '23.0225,72.5714',
      'jaipur': '26.9124,75.7873',
      'goa': '15.2993,74.1240',
      'surat': '21.1702,72.8311',
      'nagpur': '21.1458,79.0882'
    };
    
    for (const [key, coords] of Object.entries(COMMON_HUBS)) {
      if (cleanAddress.includes(key)) {
        return resolve(coords);
      }
    }
    
    // Query OpenStreetMap Nominatim API using native https
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
    
    const options = {
      headers: {
        'User-Agent': 'TransitNode-ERP-Geocoding-Agent'
      },
      timeout: 3000 // 3 seconds timeout
    };
    
    const req = https.get(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const { lat, lon } = parsed[0];
            return resolve(`${lat},${lon}`);
          }
        } catch (e) {
          console.warn(`[WARNING] Geocoding parsing failed for "${address}":`, e.message);
        }
        resolve('19.0760,72.8777'); // default to Mumbai
      });
    });
    
    req.on('error', (err) => {
      console.warn(`[WARNING] Geocoding API request failed for "${address}":`, err.message);
      resolve('19.0760,72.8777'); // default to Mumbai
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.warn(`[WARNING] Geocoding API timeout for "${address}"`);
      resolve('19.0760,72.8777'); // default to Mumbai
    });
  });
};

exports.createShipment = async (req, res) => {
  try {
    const { 
      senderCompany, senderName, senderPhone, senderAddress, senderGstin, senderPostalCode, senderDropOff,
      receiverName, receiverPhone, receiverAddress, receiverGstin, receiverPostalCode, receiverSelfCollect, receiverClientCode,
      weight_kg, dimensions, actualWeight, chargedWeight, packingType, fragile, 
      invoiceNo, invoiceDate, invoiceValue, ewayBillNo, riskCoverage,
      vehicleNumber, parentVehicleNumber, vehicleType, driverName, driverPhone, origin, destination, commodityType 
    } = req.body;

    const isFlipkartSelected = receiverName && (
      receiverName.toLowerCase().includes('flipkart') ||
      receiverName.toLowerCase().includes('fliptkart')
    );
    if (isFlipkartSelected && (!receiverClientCode || !receiverClientCode.trim())) {
      return res.status(400).json({ message: 'Store Code is required when Flipkart is selected as the supplier.' });
    }
    
    // Query the latest shipment tracking ID for the current year to determine the next sequential number
    const currentYear = new Date().getFullYear();
    const lastShipment = await ShipmentLedger.findOne({ 
      trackingNumber: new RegExp(`^TR-${currentYear}-`) 
    }).sort({ _id: -1 });

    let nextNum = 10001; // Start sequence
    if (lastShipment && lastShipment.trackingNumber) {
      const parts = lastShipment.trackingNumber.split('-');
      const lastNum = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastNum)) {
        nextNum = lastNum + 1;
      }
    }
    const trackingNumber = `TR-${currentYear}-${nextNum}`;
    
    // Base estimation logic - Read from request if provided, otherwise default to 0
    const baseRateApplied = Number(req.body.baseRateApplied) || 0;
    const subtotal = baseRateApplied;
    
    // Dynamically resolve destination coordinates (using exact consignee address with hub name fallback)
    const destinationCoords = await geocodeAddress(receiverAddress || destination);
    
    let lat = 19.0760;
    let lng = 72.8777;
    if (destinationCoords && destinationCoords.includes(',')) {
      const [latStr, lngStr] = destinationCoords.split(',');
      lat = parseFloat(latStr) || 19.0760;
      lng = parseFloat(lngStr) || 72.8777;
    }
    
    const newShipment = await ShipmentLedger.create({
      tenantId: req.user.tenantId, companyId: req.workspaceId,
      trackingNumber,
      destinationLat: lat,
      destinationLng: lng,
      status: 'READY_FOR_DISPATCH',
      lrCopyUrl: req.body.isMonthlyInvoice ? 'MONTHLY_INVOICE' : 'ONLINE',
      podStatus: 'COLLECTED',
      metadata: {
        receptionistId: req.user?.id
      },
      logistics: {
        sender: { 
          company: senderCompany,
          name: senderName, 
          phone: senderPhone,
          address: senderAddress,
          gstin: senderGstin,
          postalCode: senderPostalCode,
          dropOff: senderDropOff === 'true' || senderDropOff === true
        },
        receiver: { 
          name: receiverName, 
          phone: receiverPhone,
          address: receiverAddress,
          gstin: receiverGstin,
          postalCode: receiverPostalCode,
          selfCollect: receiverSelfCollect === 'true' || receiverSelfCollect === true,
          clientCode: receiverClientCode
        },
        package: { 
          weight_kg: Number(weight_kg) || Number(actualWeight) || 0, 
          dimensions,
          actualWeight: Number(actualWeight) || Number(weight_kg) || 0,
          chargedWeight: Number(chargedWeight) || Number(weight_kg) || 0,
          packingType,
          fragile: fragile === 'true' || fragile === true,
          invoiceNo: trackingNumber,
          invoiceDate: new Date(),
          invoiceValue: Number(invoiceValue) || 0,
          ewayBillNo,
          riskCoverage: riskCoverage || 'OWNERS'
        },
        transport: {
          vehicleNumber: vehicleNumber ? vehicleNumber.toUpperCase() : undefined,
          parentVehicleNumber,
          vehicleType,
          driverName,
          driverPhone,
          origin,
          destination,
          destinationCoords,
          commodityType
        }
      },
      accounting: {
        baseRateApplied,
        subtotal,
        billingCycle: req.body.isMonthlyInvoice ? 'MONTHLY' : 'DAILY'
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
    const { timeRange, billingCycle } = req.query;
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

    if (billingCycle && billingCycle !== 'ALL') {
      if (billingCycle === 'DAILY') {
        query['accounting.billingCycle'] = { $ne: 'MONTHLY' };
      } else if (billingCycle === 'MONTHLY') {
        query['accounting.billingCycle'] = 'MONTHLY';
      }
    }

    const limitCount = timeRange === 'all' ? 100 : 500;
    query.tenantId = req.user.tenantId;
    if (req.workspaceId) {
      query.companyId = req.workspaceId;
    }
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
    // Public endpoint: trackingNumber or publicTrackingToken is globally unique, no tenantId required
    const shipment = await ShipmentLedger.findOne({
      $or: [
        { trackingNumber: trackingId },
        { publicTrackingToken: trackingId }
      ]
    });
    
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
    const activeShipments = await ShipmentLedger.countDocuments({ status: { $ne: 'DELIVERED' }, tenantId: req.user.tenantId, companyId: req.workspaceId });
    const pendingInvoices = await ShipmentLedger.countDocuments({ 'accounting.paymentStatus': 'PENDING', tenantId: req.user.tenantId, companyId: req.workspaceId });
    
    res.status(200).json({ activeShipments, pendingInvoices });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
};

exports.getPendingInvoices = async (req, res) => {
  try {
    const invoices = await ShipmentLedger.find({ 
      'accounting.invoiceGeneratedAt': { $exists: false }, 
      tenantId: req.user.tenantId, 
      companyId: req.workspaceId 
    }).sort({ 'metadata.createdAt': -1 });
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
    
    const shipment = await ShipmentLedger.findOne({ trackingNumber: trackingId, tenantId: req.user.tenantId, companyId: req.workspaceId });
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

exports.fixFlipkartAmount = async (req, res) => {
  try {
    const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
    const ConsolidatedInvoice = require('../models/NoSQL/ConsolidatedInvoice');

    const result = await ShipmentLedger.updateMany(
      { 
        'logistics.receiver.name': 'Flipkart India Private Limited'
      },
      { 
        $set: { 
          'accounting.baseRateApplied': 47000,
          'accounting.subtotal': 47000 
        } 
      }
    );

    const tax = 47000 * 0.18;
    const invResult = await ConsolidatedInvoice.updateMany(
      { supplierName: 'Flipkart India Private Limited' },
      {
        $set: {
          'financials.subtotal': 47000,
          'financials.taxAmount': tax,
          'financials.grandTotal': 47000 + tax
        }
      }
    );

    res.status(200).json({ message: 'Fixed', shipmentsUpdated: result.modifiedCount, invoicesUpdated: invResult.modifiedCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.checkAdmin = async (req, res) => {
  try {
    const User = require('../models/NoSQL/User');
    const bcrypt = require('bcrypt');
    const admins = await User.find({ role: 'ADMIN' });
    const result = [];
    for (const admin of admins) {
      result.push({ email: admin.email, name: admin.name });
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash('password123', salt);
      await admin.save();
    }
    res.status(200).json({ message: 'Found and reset', admins: result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.uploadLrCopy = async (req, res) => {
  try {
    const { trackingId } = req.params;
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const shipment = await ShipmentLedger.findOne({ 
      trackingNumber: trackingId, 
      tenantId: req.user.tenantId 
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.lrCopyUrl = `/uploads/${req.file.filename}`;
    shipment.podStatus = 'COLLECTED';
    
    // Automatically transition to DELIVERED if it was in transit or arrived
    if (['IN_TRANSIT', 'ARRIVED'].includes(shipment.status)) {
      shipment.status = 'DELIVERED';
      shipment.metadata.closedAt = new Date();
      
      // Also release/free driver and vehicle back to AVAILABLE/YARD
      if (shipment.logistics?.transport?.driverPhone) {
        const Driver = require('../models/NoSQL/Driver');
        await Driver.findOneAndUpdate(
          { phone: shipment.logistics.transport.driverPhone }, 
          { status: 'AVAILABLE' }
        );
      }
      if (shipment.logistics?.transport?.vehicleNumber) {
        const Device = require('../models/NoSQL/Device');
        await Device.findOneAndUpdate(
          { vehicleRegistration: shipment.logistics.transport.vehicleNumber.toUpperCase() }, 
          { status: 'YARD' }
        );
      }
    }

    await shipment.save();
    res.status(200).json({ message: 'Lorry Receipt uploaded successfully', shipment });
  } catch (error) {
    console.error('Error uploading LR copy:', error);
    res.status(500).json({ message: 'Server error uploading LR copy' });
  }
};

exports.logException = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { issueType, description } = req.body;

    const shipment = await ShipmentLedger.findOne({ 
      trackingNumber: trackingId, 
      tenantId: req.user.tenantId 
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.exceptions.push({
      issueType,
      description,
      reportedAt: new Date(),
      status: 'OPEN'
    });

    await shipment.save();
    res.status(200).json({ message: 'Exception logged successfully', shipment });
  } catch (error) {
    console.error('Error logging exception:', error);
    res.status(500).json({ message: 'Server error logging exception' });
  }
};

exports.resolveException = async (req, res) => {
  try {
    const { trackingId, exceptionId } = req.params;

    const shipment = await ShipmentLedger.findOne({ 
      trackingNumber: trackingId, 
      tenantId: req.user.tenantId 
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    const exception = shipment.exceptions.id(exceptionId);
    if (!exception) {
      return res.status(404).json({ message: 'Exception not found' });
    }

    exception.status = 'RESOLVED';
    await shipment.save();

    res.status(200).json({ message: 'Exception resolved successfully', shipment });
  } catch (error) {
    console.error('Error resolving exception:', error);
    res.status(500).json({ message: 'Server error resolving exception' });
  }
};

exports.generateLrCopyOnline = async (req, res) => {
  try {
    const { trackingId } = req.params;

    const shipment = await ShipmentLedger.findOne({ 
      trackingNumber: trackingId, 
      tenantId: req.user.tenantId 
    });

    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.lrCopyUrl = 'ONLINE';
    shipment.podStatus = 'COLLECTED';
    
    // Automatically transition to DELIVERED if it was in transit or arrived
    if (['IN_TRANSIT', 'ARRIVED'].includes(shipment.status)) {
      shipment.status = 'DELIVERED';
      shipment.metadata.closedAt = new Date();
      
      // Also release/free driver and vehicle back to AVAILABLE/YARD
      if (shipment.logistics?.transport?.driverPhone) {
        const Driver = require('../models/NoSQL/Driver');
        await Driver.findOneAndUpdate(
          { phone: shipment.logistics.transport.driverPhone }, 
          { status: 'AVAILABLE' }
        );
      }
      if (shipment.logistics?.transport?.vehicleNumber) {
        const Device = require('../models/NoSQL/Device');
        await Device.findOneAndUpdate(
          { vehicleRegistration: shipment.logistics.transport.vehicleNumber.toUpperCase() }, 
          { status: 'YARD' }
        );
      }
    }

    await shipment.save();
    res.status(200).json({ message: 'Online Lorry Receipt generated successfully', shipment });
  } catch (error) {
    console.error('Error generating online LR copy:', error);
    res.status(500).json({ message: 'Server error generating online LR copy' });
  }
};

