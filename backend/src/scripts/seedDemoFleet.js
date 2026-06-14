const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Driver = require('../models/NoSQL/Driver');
const Device = require('../models/NoSQL/Device');
const User = require('../models/NoSQL/User');
const bcrypt = require('bcrypt');

// Load environment variables for MongoDB connection
dotenv.config({ path: path.join(__dirname, '../../.env') });

const driversData = [
  { name: 'Ramesh Patil', phone: '9822112233', licenseNumber: 'MH12-2015-0012345', status: 'AVAILABLE' },
  { name: 'Abdul Khan', phone: '9833223344', licenseNumber: 'MH14-2018-0023456', status: 'AVAILABLE' },
  { name: 'Santosh Kumar', phone: '9844334455', licenseNumber: 'UP32-2016-0034567', status: 'AVAILABLE' },
  { name: 'Vikram Singh', phone: '9855445566', licenseNumber: 'RJ14-2019-0045678', status: 'AVAILABLE' },
  { name: 'Kiran Desai', phone: '9866556677', licenseNumber: 'GJ05-2020-0056789', status: 'AVAILABLE' },
];

const devicesData = [
  { imei: '868120045671001', vehicleRegistration: 'MH 12 AB 1001', vehicleType: 'Container', status: 'YARD' },
  { imei: '868120045671002', vehicleRegistration: 'MH 14 CD 2002', vehicleType: 'Open Truck', status: 'YARD' },
  { imei: '868120045671003', vehicleRegistration: 'UP 32 EF 3003', vehicleType: 'Trailer', status: 'YARD' },
  { imei: '868120045671004', vehicleRegistration: 'RJ 14 GH 4004', vehicleType: 'Container', status: 'YARD' },
  { imei: '868120045671005', vehicleRegistration: 'GJ 05 IJ 5005', vehicleType: 'Open Truck', status: 'YARD' },
];

const seedDemoFleet = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitnode';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB for Demo Seeding');

    // 1. Insert Drivers and create User accounts
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('TN@pass123', salt);

    for (let i = 0; i < driversData.length; i++) {
      const d = driversData[i];
      const existingDriver = await Driver.findOne({ phone: d.phone });
      
      if (!existingDriver) {
        const newDriver = new Driver(d);
        await newDriver.save();
        console.log(`🚚 Added Driver: ${d.name}`);
        driversData[i]._id = newDriver._id;
      } else {
        console.log(`⚠️ Driver ${d.name} already exists.`);
        driversData[i]._id = existingDriver._id;
      }

      // Check and create User account for driver
      const existingUser = await User.findOne({ username: d.phone });
      if (!existingUser) {
        const newUser = new User({
          username: d.phone,
          email: `${d.phone}@transitnode.demo`,
          password: defaultPassword,
          name: d.name,
          role: 'DRIVER',
          isActive: true,
          driverProfile: {
            fullName: d.name,
            licenseNumber: d.licenseNumber,
            phoneNumber: d.phone,
          }
        });
        await newUser.save();
        console.log(`👤 Created User account for: ${d.name} (Username: ${d.phone})`);
      }
    }

    // 2. Insert Devices and implicitly assign drivers (1-to-1 mapping for demo)
    for (let i = 0; i < devicesData.length; i++) {
      const dev = devicesData[i];
      const existingDevice = await Device.findOne({ imei: dev.imei });
      
      const driver = driversData[i]; // Pair driver i with device i
      
      if (!existingDevice) {
        const newDevice = new Device({
          ...dev,
          driverName: driver.name,
          driverPhone: driver.phone
        });
        await newDevice.save();
        console.log(`🚛 Added Vehicle: ${dev.vehicleRegistration}`);
      } else {
        console.log(`⚠️ Vehicle ${dev.vehicleRegistration} already exists.`);
      }

      // ALWAYS Update the Driver model to reflect the assigned vehicle
      await Driver.findByIdAndUpdate(driver._id, { assignedVehicle: dev.vehicleRegistration });
      
      // ALWAYS Update the User model to reflect the assigned vehicle
      await User.findOneAndUpdate(
        { username: driver.phone },
        { $set: { 'driverProfile.assignedVehicle': dev.vehicleRegistration } }
      );
      
      console.log(`🔗 Mapped vehicle ${dev.vehicleRegistration} to driver ${driver.name} (and User profile)`);
    }

    console.log('🎉 Successfully seeded 5 Demo Drivers and 5 Demo Vehicles!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during demo seeding:', error);
    process.exit(1);
  }
};

seedDemoFleet();
