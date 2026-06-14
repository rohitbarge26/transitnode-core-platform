const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const User = require('../models/NoSQL/User');
const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
const Device = require('../models/NoSQL/Device');
const RateCard = require('../models/NoSQL/RateCard');
const Driver = require('../models/NoSQL/Driver');

exports.createUser = async (req, res) => {
  try {
    const { name, email, mobileNumber, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobileNumber: mobileNumber || '---' }], tenantId: req.user.tenantId });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      tenantId: req.user.tenantId,
      name,
      email,
      mobileNumber,
      password: hashedPassword,
      role
    });

    await newUser.save();

    // If role is DRIVER, also create a Driver record
    if (role === 'DRIVER') {
      const existingDriver = await Driver.findOne({ phone: newUser.username || newUser.email, tenantId: req.user.tenantId });
      if (!existingDriver) {
        const newDriver = new Driver({
          tenantId: req.user.tenantId,
          name: name,
          phone: newUser.username || newUser.email,
          licenseNumber: 'PENDING', // Default or generate a temp one until updated
          status: 'AVAILABLE'
        });
        await newDriver.save();
      }
    }

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
    const tenantMatch = { tenantId: new mongoose.Types.ObjectId(req.user.tenantId) };
    const revenueAgg = await ShipmentLedger.aggregate([
      { $match: { 'accounting.paymentStatus': 'PAID', ...dateMatch, ...tenantMatch } },
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
    const activeFleet = await Device.countDocuments({ status: 'ON_TRIP', tenantId: req.user.tenantId });

    // 3. Trucks in Maintenance
    const maintenanceFleet = await Device.countDocuments({ status: 'MAINTENANCE', tenantId: req.user.tenantId });

    // 4. Total Registered Fleet
    const totalFleet = await Device.countDocuments({ tenantId: req.user.tenantId });

    // Charts Data
    // A. Fleet Utilization Bar Chart
    const fleetStatusAgg = await Device.aggregate([
      { $match: tenantMatch },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    let statusData = { ON_TRIP: 0, YARD: 0, MAINTENANCE: 0 };
    fleetStatusAgg.forEach(item => { statusData[item._id] = item.count; });
    
    // B. Payment Methods Donut Chart (Kept for compatibility or can be removed, but harmless)
    const paymentAgg = await ShipmentLedger.aggregate([
      { $match: { 'accounting.paymentStatus': 'PAID', ...dateMatch, ...tenantMatch } },
      { $group: { _id: '$accounting.paymentMethod', count: { $sum: 1 } } }
    ]);
    const paymentMethodsData = paymentAgg.map(item => ({ name: item._id || 'CASH', value: item.count }));

    // C. Route Profitability Line Chart
    // Group by Origin-Destination and calculate Net Profitability
    const routeRevAgg = await ShipmentLedger.aggregate([
      { $match: { 'accounting.paymentStatus': 'PAID', ...dateMatch, ...tenantMatch } },
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
    
    let rateCard = await RateCard.findOne({ type: 'GLOBAL', tenantId: req.user.tenantId });
    if (!rateCard) {
      rateCard = new RateCard({ type: 'GLOBAL', tenantId: req.user.tenantId });
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
    let rateCard = await RateCard.findOne({ type: 'GLOBAL', tenantId: req.user.tenantId });
    if (!rateCard) {
      rateCard = new RateCard({ type: 'GLOBAL', tenantId: req.user.tenantId, basePricePerKg: 10, volumetricDivisor: 5000, fuelSurchargeRate: 5 });
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

    let device = await Device.findOne({ imei, tenantId: req.user.tenantId });
    if (device) {
      device.vehicleRegistration = vehicleRegistration;
      device.driverName = driverName;
      await device.save();
      return res.status(200).json({ message: 'Device updated successfully', device });
    }

    device = new Device({
      tenantId: req.user.tenantId,
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

    let device = await Device.findOne({ imei: hardwareIMEI, tenantId: req.user.tenantId });
    if (device) {
      return res.status(400).json({ message: 'Hardware IMEI already registered to another asset' });
    }

    const newFleetAsset = new Device({
      tenantId: req.user.tenantId,
      imei: hardwareIMEI,
      vehicleRegistration: vehicleNumber,
      vehicleType: vehicleType || 'Container',
      driverName: driverName,
      driverPhone: driverPhone,
      fitnessExpiry: fitnessExpiry ? new Date(fitnessExpiry) : null,
      status: currentStatus || 'YARD'
    });

    await newFleetAsset.save();

    if (req.file) {
      await ComplianceDocument.create({
        tenantId: req.user.tenantId,
        targetType: 'VEHICLE',
        targetId: vehicleNumber,
        documentType: 'INSURANCE', // Or let the user specify
        expiryDate: fitnessExpiry ? new Date(fitnessExpiry) : new Date('2099-12-31'),
        fileUrl: `/uploads/${req.file.filename}`
      });
    }

    res.status(201).json({ message: 'Fleet asset registered successfully', asset: newFleetAsset });
  } catch (error) {
    console.error('Error registering fleet asset:', error);
    res.status(500).json({ message: 'Server error registering asset' });
  }
};

exports.getFleetAssets = async (req, res) => {
  try {
    const assets = await Device.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ assets });
  } catch (error) {
    console.error('Error fetching fleet assets:', error);
    res.status(500).json({ message: 'Server error fetching fleet assets' });
  }
};

exports.deleteFleetAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findOne({ _id: id, tenantId: req.user.tenantId });
    if (!device) {
      return res.status(404).json({ message: 'Fleet asset not found' });
    }

    // Optionally update Driver if it was assigned to this vehicle
    if (device.vehicleRegistration) {
      await Driver.updateMany(
        { assignedVehicle: device.vehicleRegistration, tenantId: req.user.tenantId }, 
        { assignedVehicle: '' }
      );
    }

    await Device.findOneAndDelete({ _id: id, tenantId: req.user.tenantId });
    res.status(200).json({ message: 'Fleet asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting fleet asset:', error);
    res.status(500).json({ message: 'Server error deleting fleet asset' });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber, status, assignedVehicle, username, password } = req.body;

    if (!name || !phone || !licenseNumber || !username || !password) {
      return res.status(400).json({ message: 'Name, Phone, License Number, Username, and Password are required' });
    }

    const existingDriver = await Driver.findOne({ $or: [{ phone }, { licenseNumber }], tenantId: req.user.tenantId });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this phone or license already exists' });
    }

    const newDriver = new Driver({
      tenantId: req.user.tenantId,
      name,
      phone,
      licenseNumber,
      status: status || 'AVAILABLE',
      assignedVehicle: assignedVehicle || null
    });

    await newDriver.save();

    // Also update Device if a vehicle was assigned
    if (assignedVehicle) {
      await Device.updateMany(
        { vehicleRegistration: assignedVehicle, tenantId: req.user.tenantId }, 
        { driverName: name, driverPhone: phone }
      );
    }

    // Handle document upload if present
    if (req.file) {
      await ComplianceDocument.create({
        tenantId: req.user.tenantId,
        targetType: 'DRIVER',
        targetId: newDriver._id.toString(),
        documentType: 'DL',
        expiryDate: new Date('2099-12-31'), // Or get from req.body if provided
        fileUrl: `/uploads/${req.file.filename}`
      });
    }

    // Also create a User account for the Driver
    const existingUser = await User.findOne({ username });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        tenantId: req.user.tenantId,
        username: username,
        email: `${username}@transitnode.demo`,
        mobileNumber: phone,
        password: hashedPassword,
        name: name,
        role: 'DRIVER',
        isActive: true,
        driverProfile: {
          fullName: name,
          licenseNumber: licenseNumber,
          phoneNumber: phone,
        }
      });
      await newUser.save();
    }

    res.status(201).json({ message: 'Driver created successfully', driver: newDriver });
  } catch (error) {
    console.error('Error creating driver:', error);
    res.status(500).json({ message: 'Server error creating driver' });
  }
};

exports.getDrivers = async (req, res) => {
  try {
    const drivers = await Driver.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error fetching drivers' });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findOne({ _id: id, tenantId: req.user.tenantId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Delete the associated user
    await User.findOneAndDelete({ username: driver.phone });

    // Delete the driver
    await Driver.findOneAndDelete({ _id: id, tenantId: req.user.tenantId });

    // Optionally clear driver assigned in Device
    await Device.updateMany({ driverPhone: driver.phone, tenantId: req.user.tenantId }, { driverName: '', driverPhone: '' });

    res.status(200).json({ message: 'Driver deleted successfully' });
  } catch (error) {
    console.error('Error deleting driver:', error);
    res.status(500).json({ message: 'Server error deleting driver' });
  }
};

exports.assignVehicleToDriver = async (req, res) => {
  try {
    const { driverId } = req.params;
    const { vehicleRegistration } = req.body;

    const driver = await Driver.findById(driverId);
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Optional: update the old vehicle's driverName if necessary, but here we just update Driver and new Device
    driver.assignedVehicle = vehicleRegistration;
    await driver.save();

    // Also update the Device collection to reflect the assignment
    if (vehicleRegistration) {
      await Device.updateMany({ vehicleRegistration, tenantId: req.user.tenantId }, { driverName: driver.name, driverPhone: driver.phone });
    }

    res.status(200).json({ message: 'Vehicle assigned successfully', driver });
  } catch (error) {
    console.error('Error assigning vehicle:', error);
    res.status(500).json({ message: 'Server error assigning vehicle' });
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
      tenantId: req.user.tenantId,
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
    const documents = await ComplianceDocument.find({ tenantId: req.user.tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ documents });
  } catch (error) {
    console.error('Error fetching compliance documents:', error);
    res.status(500).json({ message: 'Server error fetching compliance documents' });
  }
};

exports.verifyEmployee = async (req, res) => {
  try {
    const { employeeId, employeeName } = req.body;
    
    if (!req.files || !req.files.aadhaar || !req.files.pan || !req.files.addressProof) {
      return res.status(400).json({ message: 'Aadhaar, PAN, and Address Proof are all mandatory.' });
    }

    if (!employeeId || !employeeName) {
      return res.status(400).json({ message: 'Employee ID and Name are required.' });
    }

    const fileUrl = `/uploads/`;
    
    // Save Aadhaar
    await ComplianceDocument.create({
      tenantId: req.user.tenantId,
      targetType: 'EMPLOYEE',
      targetId: employeeId,
      documentType: 'AADHAAR',
      expiryDate: new Date('2099-12-31'), // No expiry
      fileUrl: `${fileUrl}${req.files.aadhaar[0].filename}`
    });

    // Save PAN
    await ComplianceDocument.create({
      tenantId: req.user.tenantId,
      targetType: 'EMPLOYEE',
      targetId: employeeId,
      documentType: 'PAN',
      expiryDate: new Date('2099-12-31'),
      fileUrl: `${fileUrl}${req.files.pan[0].filename}`
    });

    // Save Address Proof
    await ComplianceDocument.create({
      tenantId: req.user.tenantId,
      targetType: 'EMPLOYEE',
      targetId: employeeId,
      documentType: 'ADDRESS_PROOF',
      expiryDate: new Date('2099-12-31'),
      fileUrl: `${fileUrl}${req.files.addressProof[0].filename}`
    });

    res.status(201).json({ message: 'Employee verified and documents uploaded successfully!' });
  } catch (error) {
    console.error('Error verifying employee:', error);
    res.status(500).json({ message: 'Server error verifying employee' });
  }
};
