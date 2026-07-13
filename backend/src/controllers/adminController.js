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
    
    // Fetch Tenant to check plan limits
    const Tenant = require('../models/NoSQL/Tenant');
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Define limits based on planType
    const planLimits = {
      'TRIAL': 3,
      'SILVER': 10,
      'PLATINUM': 999999, // Unlimited
      'LIFETIME': 999999 // Unlimited
    };
    
    const maxUsers = planLimits[tenant.planType] || 3;
    const currentUserCount = await User.countDocuments({ tenantId: req.user.tenantId });

    if (currentUserCount >= maxUsers) {
      return res.status(403).json({ message: `User creation limit reached! Your ${tenant.planType} plan allows a maximum of ${maxUsers} users. Please upgrade your subscription.` });
    }

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
      const existingDriver = await Driver.findOne({ phone: newUser.username || newUser.email, tenantId: req.user.tenantId, companyId: req.workspaceId });
      if (!existingDriver) {
        const newDriver = new Driver({
          tenantId: req.user.tenantId, companyId: req.workspaceId,
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
    if (req.workspaceId) {
      tenantMatch.companyId = new mongoose.Types.ObjectId(req.workspaceId);
    }
    const revenueAgg = await ShipmentLedger.aggregate([
      { $match: { 'accounting.paymentStatus': 'PAID', ...dateMatch, ...tenantMatch } },
      { $group: { 
          _id: null, 
          grossTotal: { $sum: { $ifNull: ['$accounting.grandTotal', '$accounting.subtotal'] } },
          dailyTotal: { 
            $sum: { 
              $cond: [
                { $ne: ['$accounting.billingCycle', 'MONTHLY'] }, 
                { $ifNull: ['$accounting.grandTotal', '$accounting.subtotal'] }, 
                0
              ] 
            } 
          },
          monthlyTotal: { 
            $sum: { 
              $cond: [
                { $eq: ['$accounting.billingCycle', 'MONTHLY'] }, 
                { $ifNull: ['$accounting.grandTotal', '$accounting.subtotal'] }, 
                0
              ] 
            } 
          },
          advances: { $sum: '$accounting.driverAdvanceCash' },
          fuel: { $sum: '$accounting.fuelVoucherAmount' },
          tolls: { $sum: '$accounting.tollAllowance' }
      } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].grossTotal : 0;
    const dailyRevenue = revenueAgg.length > 0 ? revenueAgg[0].dailyTotal : 0;
    const monthlyRevenue = revenueAgg.length > 0 ? revenueAgg[0].monthlyTotal : 0;
    const totalExpenses = revenueAgg.length > 0 ? (revenueAgg[0].advances + revenueAgg[0].fuel + revenueAgg[0].tolls) : 0;
    const netProfit = totalRevenue - totalExpenses;
    const netFleetMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;

    const baseQuery = { tenantId: req.user.tenantId };
    if (req.workspaceId) {
      baseQuery.companyId = req.workspaceId;
    }

    // 2. Active Fleet on Road
    const activeFleet = await Device.countDocuments({ status: 'ON_TRIP', ...baseQuery });

    // 3. Trucks in Maintenance
    const maintenanceFleet = await Device.countDocuments({ status: 'MAINTENANCE', ...baseQuery });

    // 4. Total Registered Fleet
    const totalFleet = await Device.countDocuments(baseQuery);

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
          gross: { $sum: { $ifNull: ['$accounting.grandTotal', '$accounting.subtotal'] } },
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



    res.status(200).json({
      metrics: {
        totalRevenue,
        dailyRevenue,
        monthlyRevenue,
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
    const { companyId, supplierId, templateType, basePricePerKg, volumetricDivisor, fuelSurchargeRate, rows } = req.body;
    
    let targetCompanyId = null;
    let targetSupplierId = null;

    if (companyId && companyId !== 'MAIN' && companyId !== req.user.tenantId.toString()) {
      targetCompanyId = companyId;
    }
    if (supplierId && supplierId !== 'NONE') {
      targetSupplierId = supplierId;
    }
    let validatedRows = [];
    const activeTemplateType = templateType || 'TEMPLATE_C';

    if (activeTemplateType === 'TEMPLATE_A' && Array.isArray(rows)) {
      validatedRows = rows
        .map(row => ({
          from: (row.from || '').trim(),
          to: (row.to || '').trim(),
          vehicleType: row.vehicleType || 'Van (or Eeco)',
          billingType: row.billingType || 'Fixed',
          fixedKms: Number(row.fixedKms) || 0,
          rate12h: Number(row.rate12h) || 0,
          rate24h: Number(row.rate24h) || 0,
          extraKmRate: Number(row.extraKmRate) || 0,
          extraHourRate: Number(row.extraHourRate) || 0,
          detentionCharges: Number(row.detentionCharges) || 0,
        }))
        .filter(row => row.from && row.to); // eliminate blank origin/destination entries

      // Validate non-negative numbers and billing types
      const allowedBillingTypes = ['Fixed', 'Per KM', 'Per Trip', 'Monthly', 'Adhoc'];
      for (const row of validatedRows) {
        if (
          row.fixedKms < 0 || row.rate12h < 0 || row.rate24h < 0 ||
          row.extraKmRate < 0 || row.extraHourRate < 0 || row.detentionCharges < 0
        ) {
          return res.status(400).json({ message: 'All numeric values for route rates must be non-negative.' });
        }
        if (!allowedBillingTypes.includes(row.billingType)) {
          return res.status(400).json({ message: `Invalid billing type "${row.billingType}". Must be one of: ${allowedBillingTypes.join(', ')}` });
        }
      }
    } else if (activeTemplateType === 'TEMPLATE_B' && Array.isArray(rows)) {
      validatedRows = rows
        .map(row => ({
          storeCode: (row.storeCode || '').trim(),
          storeName: (row.storeName || '').trim(),
          location: (row.location || '').trim(),
          pincode: Number(row.pincode) || null,
          city: (row.city || '').trim(),
          state: (row.state || '').trim(),
          zone: (row.zone || '').trim(),
          tataAceRate: Number(row.tataAceRate) || 0,
          tata407Rate: Number(row.tata407Rate) || 0,
          rate14ft: Number(row.rate14ft) || 0,
          rate17ft: Number(row.rate17ft) || 0,
          rate20ft: Number(row.rate20ft) || 0,
          rate32ft7ton: Number(row.rate32ft7ton) || 0,
          rate32ft9ton: Number(row.rate32ft9ton) || 0,
          rate32ft10ton: Number(row.rate32ft10ton) || 0,
          rate32ft15ton: Number(row.rate32ft15ton) || 0,
          detentionCostPerDay: Number(row.detentionCostPerDay) || 0,
          localPointCharges: Number(row.localPointCharges) || 0,
          outOfStatePointCharges: Number(row.outOfStatePointCharges) || 0,
        }))
        .filter(row => row.storeCode || row.storeName || row.location); // eliminate blank entries

      // Validate non-negative numbers
      for (const row of validatedRows) {
        if (
          row.tataAceRate < 0 || row.tata407Rate < 0 || row.rate14ft < 0 || row.rate17ft < 0 ||
          row.rate20ft < 0 || row.rate32ft7ton < 0 || row.rate32ft9ton < 0 || 
          row.rate32ft10ton < 0 || row.rate32ft15ton < 0 || row.detentionCostPerDay < 0 ||
          row.localPointCharges < 0 || row.outOfStatePointCharges < 0
        ) {
          return res.status(400).json({ message: 'All numeric values for zone rates must be non-negative.' });
        }
      }
    } else if (activeTemplateType === 'TEMPLATE_D' && Array.isArray(rows)) {
      validatedRows = rows
        .map(row => ({
          buVertical: (row.buVertical || '').trim(),
          rateType: row.rateType || 'Regular',
          vehicleType: row.vehicleType || 'TATA Ace',
          origin: (row.origin || '').trim(),
          fuelRate: Number(row.fuelRate) || 0,
          agreedDays: Number(row.agreedDays) || 0,
          deploymentHour: Number(row.deploymentHour) || 0,
          fixKm: Number(row.fixKm) || 0,
          rateAtFixKm: Number(row.rateAtFixKm) || 0,
          extraKmRate: Number(row.extraKmRate) || 0,
          extraHourRate: Number(row.extraHourRate) || 0,
          startEffectiveDate: (row.startEffectiveDate || '').trim(),
          expiryDate: (row.expiryDate || '').trim(),
        }))
        .filter(row => row.origin); // require at least origin

      // Validate non-negative numbers
      for (const row of validatedRows) {
        if (
          row.fuelRate < 0 || row.agreedDays < 0 || row.deploymentHour < 0 ||
          row.fixKm < 0 || row.rateAtFixKm < 0 || row.extraKmRate < 0 || row.extraHourRate < 0
        ) {
          return res.status(400).json({ message: 'All numeric values for dedicated deployment must be non-negative.' });
        }
      }
    }

    let rateCard = await RateCard.findOne({ type: 'GLOBAL', tenantId: req.user.tenantId, companyId: targetCompanyId, supplierId: targetSupplierId });
    if (!rateCard) {
      rateCard = new RateCard({ type: 'GLOBAL', tenantId: req.user.tenantId, companyId: targetCompanyId, supplierId: targetSupplierId });
    }

    // Ensure rows is an object map to preserve different template configurations
    if (!rateCard.rows || Array.isArray(rateCard.rows)) {
      const oldRows = Array.isArray(rateCard.rows) ? rateCard.rows : [];
      rateCard.rows = {
        TEMPLATE_A: rateCard.templateType === 'TEMPLATE_A' ? oldRows : [],
        TEMPLATE_B: rateCard.templateType === 'TEMPLATE_B' ? oldRows : [],
        TEMPLATE_D: rateCard.templateType === 'TEMPLATE_D' ? oldRows : []
      };
    }

    rateCard.templateType = activeTemplateType;
    if (activeTemplateType === 'TEMPLATE_A') {
      rateCard.rows.TEMPLATE_A = validatedRows;
      rateCard.markModified('rows');
    } else if (activeTemplateType === 'TEMPLATE_B') {
      rateCard.rows.TEMPLATE_B = validatedRows;
      rateCard.markModified('rows');
    } else if (activeTemplateType === 'TEMPLATE_D') {
      rateCard.rows.TEMPLATE_D = validatedRows;
      rateCard.markModified('rows');
    }

    await rateCard.save();
    res.status(200).json({ message: 'Rate card updated successfully', rateCard });
  } catch (error) {
    console.error('Error updating rates:', error);
    res.status(500).json({ message: 'Server error updating rates' });
  }
};

exports.getRates = async (req, res) => {
  try {
    const { companyId, supplierId } = req.query;
    let targetCompanyId = null;
    let targetSupplierId = null;

    if (companyId && companyId !== 'MAIN' && companyId !== req.user.tenantId.toString()) {
      targetCompanyId = companyId;
    }
    if (supplierId && supplierId !== 'NONE') {
      targetSupplierId = supplierId;
    }

    let rateCard = await RateCard.findOne({ type: 'GLOBAL', tenantId: req.user.tenantId, companyId: targetCompanyId, supplierId: targetSupplierId });
    if (!rateCard) {
      rateCard = new RateCard({
        type: 'GLOBAL',
        tenantId: req.user.tenantId,
        companyId: targetCompanyId,
        supplierId: targetSupplierId,
        templateType: 'TEMPLATE_C',
        basePricePerKg: 10,
        volumetricDivisor: 5000,
        fuelSurchargeRate: 5,
        rows: { TEMPLATE_A: [], TEMPLATE_B: [] }
      });
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

    let device = await Device.findOne({ imei, tenantId: req.user.tenantId, companyId: req.workspaceId });
    if (device) {
      device.vehicleRegistration = vehicleRegistration;
      device.driverName = driverName;
      await device.save();
      return res.status(200).json({ message: 'Device updated successfully', device });
    }

    device = new Device({
      tenantId: req.user.tenantId, companyId: req.workspaceId,
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

    let device = await Device.findOne({ imei: hardwareIMEI, tenantId: req.user.tenantId, companyId: req.workspaceId });
    if (device) {
      return res.status(400).json({ message: 'Hardware IMEI already registered to another asset' });
    }

    const newFleetAsset = new Device({
      tenantId: req.user.tenantId, companyId: req.workspaceId,
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
        tenantId: req.user.tenantId, companyId: req.workspaceId,
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
    const assets = await Device.find({ tenantId: req.user.tenantId, companyId: req.workspaceId }).sort({ createdAt: -1 });
    res.status(200).json({ assets });
  } catch (error) {
    console.error('Error fetching fleet assets:', error);
    res.status(500).json({ message: 'Server error fetching fleet assets' });
  }
};

exports.deleteFleetAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findOne({ _id: id, tenantId: req.user.tenantId, companyId: req.workspaceId });
    if (!device) {
      return res.status(404).json({ message: 'Fleet asset not found' });
    }

    // Optionally update Driver if it was assigned to this vehicle
    if (device.vehicleRegistration) {
      await Driver.updateMany(
        { assignedVehicle: device.vehicleRegistration, tenantId: req.user.tenantId, companyId: req.workspaceId }, 
        { assignedVehicle: '' }
      );
    }

    await Device.findOneAndDelete({ _id: id, tenantId: req.user.tenantId, companyId: req.workspaceId });
    res.status(200).json({ message: 'Fleet asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting fleet asset:', error);
    res.status(500).json({ message: 'Server error deleting fleet asset' });
  }
};

exports.createDriver = async (req, res) => {
  try {
    const { name, phone, licenseNumber, licenseExpiryDate, status, assignedVehicle } = req.body;

    if (!name || !phone || !licenseNumber) {
      return res.status(400).json({ message: 'Name, Phone, and License Number are required' });
    }

    const existingDriver = await Driver.findOne({ $or: [{ phone }, { licenseNumber }], tenantId: req.user.tenantId, companyId: req.workspaceId });
    if (existingDriver) {
      return res.status(400).json({ message: 'Driver with this phone or license already exists' });
    }

    const newDriver = new Driver({
      tenantId: req.user.tenantId, companyId: req.workspaceId,
      name,
      phone,
      licenseNumber,
      licenseExpiryDate,
      status: status || 'AVAILABLE',
      assignedVehicle: assignedVehicle || null
    });

    await newDriver.save();

    // Also update Device if a vehicle was assigned
    if (assignedVehicle) {
      await Device.updateMany(
        { vehicleRegistration: assignedVehicle, tenantId: req.user.tenantId, companyId: req.workspaceId }, 
        { driverName: name, driverPhone: phone }
      );
    }

    // Handle document upload if present
    if (req.file) {
      await ComplianceDocument.create({
        tenantId: req.user.tenantId, companyId: req.workspaceId,
        targetType: 'DRIVER',
        targetId: newDriver._id.toString(),
        documentType: 'DL',
        expiryDate: new Date('2099-12-31'), // Or get from req.body if provided
        fileUrl: `/uploads/${req.file.filename}`
      });
    }

    // Also proactively create a User account for the Driver using their phone number
    const existingUser = await User.findOne({ $or: [{ username: phone }, { mobileNumber: phone }] });
    if (!existingUser) {
      const salt = await bcrypt.genSalt(10);
      const randomPassword = Math.random().toString(36).slice(-10);
      const hashedPassword = await bcrypt.hash(randomPassword, salt);

      const newUser = new User({
        tenantId: req.user.tenantId,
        username: phone,
        email: `${phone}@transitnode.demo`,
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
    const drivers = await Driver.find({ tenantId: req.user.tenantId, companyId: req.workspaceId }).sort({ createdAt: -1 });
    res.status(200).json({ drivers });
  } catch (error) {
    console.error('Error fetching drivers:', error);
    res.status(500).json({ message: 'Server error fetching drivers' });
  }
};

exports.deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const driver = await Driver.findOne({ _id: id, tenantId: req.user.tenantId, companyId: req.workspaceId });
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Delete the associated user
    await User.findOneAndDelete({ username: driver.phone });

    // Delete the driver
    await Driver.findOneAndDelete({ _id: id, tenantId: req.user.tenantId, companyId: req.workspaceId });

    // Optionally clear driver assigned in Device
    await Device.updateMany({ driverPhone: driver.phone, tenantId: req.user.tenantId, companyId: req.workspaceId }, { driverName: '', driverPhone: '' });

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

    const driver = await Driver.findByIdAndUpdate(
      driverId,
      { assignedVehicle: vehicleRegistration },
      { new: true, runValidators: false }
    );
    
    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    // Also update the Device collection to reflect the assignment
    if (vehicleRegistration) {
      await Device.updateMany({ vehicleRegistration, tenantId: req.user.tenantId, companyId: req.workspaceId }, { driverName: driver.name, driverPhone: driver.phone });
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
      tenantId: req.user.tenantId, companyId: req.workspaceId,
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
    const documents = await ComplianceDocument.find({ tenantId: req.user.tenantId, companyId: req.workspaceId }).sort({ createdAt: -1 });
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
      tenantId: req.user.tenantId, companyId: req.workspaceId,
      targetType: 'EMPLOYEE',
      targetId: employeeId,
      documentType: 'AADHAAR',
      expiryDate: new Date('2099-12-31'), // No expiry
      fileUrl: `${fileUrl}${req.files.aadhaar[0].filename}`
    });

    // Save PAN
    await ComplianceDocument.create({
      tenantId: req.user.tenantId, companyId: req.workspaceId,
      targetType: 'EMPLOYEE',
      targetId: employeeId,
      documentType: 'PAN',
      expiryDate: new Date('2099-12-31'),
      fileUrl: `${fileUrl}${req.files.pan[0].filename}`
    });

    // Save Address Proof
    await ComplianceDocument.create({
      tenantId: req.user.tenantId, companyId: req.workspaceId,
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

exports.getSubscriptionDetails = async (req, res) => {
  try {
    const Tenant = require('../models/NoSQL/Tenant');
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }
    const currentUserCount = await User.countDocuments({ tenantId: req.user.tenantId });
    
    res.status(200).json({
      companyName: tenant.companyName,
      planType: tenant.planType,
      licenseExpiresAt: tenant.licenseExpiresAt,
      currentUserCount,
      customSubdomain: tenant.customSubdomain,
      gstin: tenant.gstin,
      pan: tenant.pan,
      address: tenant.address,
      state: tenant.state,
      stateCode: tenant.stateCode,
      contactNumber: (tenant.contactNumber && tenant.contactNumber.trim() !== '') ? tenant.contactNumber.trim() : tenant.registeredMobile,
      registeredMobile: tenant.registeredMobile,
      brandingOptions: tenant.brandingOptions
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ message: 'Server error fetching subscription details' });
  }
};

exports.updateSubscriptionPlan = async (req, res) => {
  try {
    const { planType } = req.body;
    if (!['TRIAL', 'SILVER', 'PLATINUM', 'LIFETIME'].includes(planType)) {
      return res.status(400).json({ message: 'Invalid plan type' });
    }
    
    const Tenant = require('../models/NoSQL/Tenant');
    const tenant = await Tenant.findById(req.user.tenantId);
    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    const licenseExpiresAt = new Date();
    if (planType === 'LIFETIME') {
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 100);
    } else if (planType === 'PLATINUM') {
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 5);
    } else if (planType === 'SILVER') {
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 3);
    } else {
      licenseExpiresAt.setDate(licenseExpiresAt.getDate() + 10); // Trial fallback
    }

    tenant.planType = planType;
    tenant.licenseExpiresAt = licenseExpiresAt;
    tenant.paymentStatus = 'PAID';
    await tenant.save();

    // Log the transaction so the Master Admin dashboard revenue updates!
    const SubscriptionTransaction = require('../models/NoSQL/SubscriptionTransaction');
    if (req.body.amount && req.body.amount > 0) {
      const transaction = new SubscriptionTransaction({
        tenantId: tenant._id,
        planType: planType,
        amount: req.body.amount,
        paymentMethod: 'UPGRADE'
      });
      await transaction.save();
    }

    res.status(200).json({ message: 'Subscription updated successfully', planType: tenant.planType, licenseExpiresAt: tenant.licenseExpiresAt });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ message: 'Server error updating subscription plan' });
  }
};

exports.createDailyRunSheet = async (req, res) => {
  try {
    const DailyRunSheet = require('../models/NoSQL/DailyRunSheet');
    const tenantId = req.user.tenantId;

    const newRunSheet = new DailyRunSheet({
      ...req.body,
      tenantId
    });

    await newRunSheet.save();
    res.status(201).json({ message: 'Daily Run Sheet created successfully', runSheet: newRunSheet });
  } catch (error) {
    console.error('Error creating Daily Run Sheet:', error);
    res.status(500).json({ message: 'Server error creating Daily Run Sheet' });
  }
};

exports.getDailyRunSheets = async (req, res) => {
  try {
    const DailyRunSheet = require('../models/NoSQL/DailyRunSheet');
    const tenantId = req.user.tenantId;
    
    const runSheets = await DailyRunSheet.find({ tenantId }).sort({ createdAt: -1 });
    res.status(200).json({ runSheets });
  } catch (error) {
    console.error('Error fetching Daily Run Sheets:', error);
    res.status(500).json({ message: 'Server error fetching Daily Run Sheets' });
  }
};
