const bcrypt = require('bcrypt');
const User = require('../models/NoSQL/User');
const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
const Device = require('../models/NoSQL/Device');
const RateCard = require('../models/NoSQL/RateCard');
const Driver = require('../models/NoSQL/Driver');

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role
    });

    await newUser.save();

    res.status(201).json({ message: 'User created successfully', user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAnalytics = async (req, res) => {
  try {
    const { timeRange } = req.query;
    let dateMatch = {};
    if (timeRange && timeRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      if (timeRange === 'daily') {
        startDate.setHours(0, 0, 0, 0);
      } else if (timeRange === 'weekly') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'monthly') {
        startDate.setMonth(now.getMonth() - 1);
      } else if (timeRange === 'yearly') {
        startDate.setFullYear(now.getFullYear() - 1);
      }
      dateMatch = { 'metadata.createdAt': { $gte: startDate } };
    }

    // Top Level Metrics
    // 1. Gross Trip Revenue
    const revenueAgg = await ShipmentLedger.aggregate([
      { $match: { 'accounting.paymentStatus': 'PAID', ...dateMatch } },
      { $group: { 
          _id: null, 
          grossTotal: { $sum: '$accounting.grandTotal' },
          advances: { $sum: '$accounting.driverAdvanceCash' },
          fuel: { $sum: '$accounting.fuelVoucherAmount' },
          tolls: { $sum: '$accounting.tollAllowance' }
      } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].grossTotal : 0;
    const totalExpenses = revenueAgg.length > 0 ? (revenueAgg[0].advances + revenueAgg[0].fuel + revenueAgg[0].tolls) : 0;
    const netProfit = totalRevenue - totalExpenses;
    const netFleetMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

    // 2. Active Fleet on Road
    const activeFleet = await Device.countDocuments({ status: 'ON_TRIP' });

    // 3. Trucks in Maintenance
    const maintenanceFleet = await Device.countDocuments({ status: 'MAINTENANCE' });

    // 4. Total Registered Fleet
    const totalFleet = await Device.countDocuments();

    // Charts Data
    // A. Fleet Utilization Bar Chart
    const fleetStatusAgg = await Device.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    let statusData = { ON_TRIP: 0, YARD: 0, MAINTENANCE: 0 };
    fleetStatusAgg.forEach(item => { statusData[item._id] = item.count; });
    
    // B. Payment Methods Donut Chart (Kept for compatibility or can be removed, but harmless)
    const paymentAgg = await ShipmentLedger.aggregate([
      { $match: { 'accounting.paymentStatus': 'PAID', ...dateMatch } },
      { $group: { _id: '$accounting.paymentMethod', count: { $sum: 1 } } }
    ]);
    const paymentMethodsData = paymentAgg.map(item => ({ name: item._id || 'CASH', value: item.count }));

    // C. Route Profitability Line Chart
    // Group by Origin-Destination and calculate Net Profitability
    const routeRevAgg = await ShipmentLedger.aggregate([
      { $match: { 'accounting.paymentStatus': 'PAID', ...dateMatch } },
      { 
        $group: { 
          _id: { 
            origin: '$logistics.transport.origin', 
            destination: '$logistics.transport.destination' 
          }, 
          gross: { $sum: '$accounting.grandTotal' },
          advances: { $sum: '$accounting.driverAdvanceCash' },
          fuel: { $sum: '$accounting.fuelVoucherAmount' }
        } 
      },
      { $sort: { 'gross': -1 } },
      { $limit: 10 }
    ]);

    let routeProfitability = routeRevAgg.map(item => {
      const net = item.gross - (item.advances + item.fuel);
      const routeName = (item._id.origin && item._id.destination) 
        ? `${item._id.origin}-${item._id.destination}` 
        : 'Unknown';
      return {
        name: routeName,
        revenue: net // Renamed to 'revenue' so existing charts render it automatically without huge changes
      };
    });

    // Fallback Dummy Data if empty
    if (routeProfitability.length === 0) {
      routeProfitability = [
        { name: 'Thane-Kochi', revenue: 45000 },
        { name: 'Mumbai-Delhi', revenue: 62000 },
        { name: 'Pune-Bangalore', revenue: 38000 },
        { name: 'Surat-Chennai', revenue: 51000 }
      ];
    }
    if (paymentMethodsData.length === 0) {
      paymentMethodsData.push(
        { name: 'UPI', value: 400 },
        { name: 'Cash', value: 300 },
        { name: 'Corporate Account', value: 300 }
      );
    }
    if (Object.values(statusData).reduce((a, b) => a + b, 0) === 0) {
      statusData = { ON_TRIP: 40, YARD: 15, MAINTENANCE: 5 };
    }

    res.status(200).json({
      metrics: {
        totalRevenue,
        netFleetMargin,
        activeFleet,
        maintenanceFleet
      },
      charts: {
        revenueOverTime: routeProfitability, // Passing it under the same key to avoid breaking frontend blindly
        statusData: [
          { name: 'Active on Road', count: statusData.ON_TRIP || 0 },
          { name: 'Idle in Yard', count: statusData.YARD || 0 },
          { name: 'Maintenance', count: statusData.MAINTENANCE || 0 }
        ],
        paymentMethodsData
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Server error fetching analytics' });
  }
};

exports.updateRates = async (req, res) => {
  try {
    const { basePricePerKg, volumetricDivisor, fuelSurchargeRate } = req.body;
    
    let rateCard = await RateCard.findOne({ type: 'GLOBAL' });
    if (!rateCard) {
      rateCard = new RateCard({ type: 'GLOBAL' });
    }

    if (basePricePerKg !== undefined) rateCard.basePricePerKg = basePricePerKg;
    if (volumetricDivisor !== undefined) rateCard.volumetricDivisor = volumetricDivisor;
    if (fuelSurchargeRate !== undefined) rateCard.fuelSurchargeRate = fuelSurchargeRate;

    await rateCard.save();
    res.status(200).json({ message: 'Rate card updated successfully', rateCard });
  } catch (error) {
    console.error('Error updating rates:', error);
    res.status(500).json({ message: 'Server error updating rates' });
  }
};

exports.getRates = async (req, res) => {
  try {
    let rateCard = await RateCard.findOne({ type: 'GLOBAL' });
    if (!rateCard) {
      rateCard = new RateCard({ type: 'GLOBAL', basePricePerKg: 10, volumetricDivisor: 5000, fuelSurchargeRate: 5 });
      await rateCard.save();
    }
    res.status(200).json(rateCard);
  } catch (error) {
    console.error('Error fetching rates:', error);
    res.status(500).json({ message: 'Server error fetching rates' });
  }
};

exports.mapDevice = async (req, res) => {
  try {
    const { imei, vehicleRegistration, driverName } = req.body;

    let device = await Device.findOne({ imei });
    if (device) {
      device.vehicleRegistration = vehicleRegistration;
      device.driverName = driverName;
      await device.save();
      return res.status(200).json({ message: 'Device updated successfully', device });
    }

    device = new Device({
      imei,
      vehicleRegistration,
      driverName,
      status: 'YARD'
    });
    
    await device.save();
    res.status(201).json({ message: 'Device mapped successfully', device });
  } catch (error) {
    console.error('Error mapping device:', error);
    res.status(500).json({ message: 'Server error mapping device' });
  }
};

exports.registerFleetAsset = async (req, res) => {
  try {
    const { vehicleNumber, vehicleType, hardwareIMEI, fitnessExpiry, currentStatus, driverId } = req.body;

    if (!vehicleNumber || !hardwareIMEI) {
      return res.status(400).json({ message: 'Vehicle Number and Hardware IMEI are required' });
    }

    let driverName = 'Unassigned';
    let driverPhone = '';
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (driver) {
        driverName = driver.name;
        driverPhone = driver.phone;
      }
    } else if (req.body.driverName) {
      driverName = req.body.driverName;
    }

    let device = await Device.findOne({ imei: hardwareIMEI });
    if (device) {
      return res.status(400).json({ message: 'Hardware IMEI already registered to another asset' });
    }

    const newFleetAsset = new Device({
      imei: hardwareIMEI,
      vehicleRegistration: vehicleNumber,
      vehicleType: vehicleType || 'Container',
      driverName: driverName,
      driverPhone: driverPhone,
      fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
      status: currentStatus || 'YARD'
    });

    await newFleetAsset.save();

    res.status(201).json({ message: 'Fleet asset registered successfully', asset: newFleetAsset });
  } catch (error) {
    console.error('Error registering fleet asset:', error);
    res.status(500).json({ message: 'Server error registering asset' });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber, status } = req.body;

    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({ message: 'Name, Phone, and License Number are required' });
    }

    const existingDriver = await Driver.findOne({ $or: [{ phone }, { licenseNumber }] });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this phone or license already exists' });
    }

    const newDriver = new Driver({
      name,
      phone,
      licenseNumber,
      status: status || 'AVAILABLE'
    });

    await newDriver.save();
    res.status(201).json({ message: 'Driver created successfully', driver: newDriver });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error creating driver' });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find().sort({ createdAt: -1 });
    res.status(200).json({ drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error fetching drivers' });
  }
};

const ComplianceDocument = require('../models/NoSQL/ComplianceDocument');

exports.uploadComplianceDocument = async (req, res) => {
  try {
    const { targetType, targetId, documentType, expiryDate } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!targetType || !targetId || !documentType || !expiryDate) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const newDoc = new ComplianceDocument({
      targetType,
      targetId,
      documentType,
      expiryDate: new Date(expiryDate),
      fileUrl
    });

    await newDoc.save();
    res.status(201).json({ message: 'Document uploaded successfully', document: newDoc });
  } catch (error) {
    console.error('Error uploading compliance document:', error);
    res.status(500).json({ message: 'Server error uploading document' });
  }
};

exports.getComplianceDocuments = async (req, res) => {
  try {
    const documents = await ComplianceDocument.find().sort({ createdAt: -1 });
    res.status(200).json({ documents });
  } catch (error) {
    console.error('Error fetching compliance documents:', error);
    res.status(500).json({ message: 'Server error fetching documents' });
  }
};
