const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/NoSQL/User');
const Driver = require('../models/NoSQL/Driver');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const syncExistingDrivers = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitnode';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB for synchronization.');

    // 1. Find all Driver role Users and ensure they are in Driver collection
    const driverUsers = await User.find({ role: 'DRIVER' });
    for (const user of driverUsers) {
      const phone = user.username || user.driverProfile?.phoneNumber || user.email;
      const existingDriver = await Driver.findOne({ phone });
      
      if (!existingDriver) {
        const newDriver = new Driver({
          name: user.name || user.driverProfile?.fullName || 'Unknown Driver',
          phone: phone,
          licenseNumber: user.driverProfile?.licenseNumber || 'PENDING',
          assignedVehicle: user.driverProfile?.assignedVehicle || null,
          status: 'AVAILABLE'
        });
        await newDriver.save();
        console.log(`🚚 Synced User ${user.name} to Driver collection.`);
      } else {
        // Just sync assignedVehicle if it's missing in Driver but present in User
        if (user.driverProfile?.assignedVehicle && existingDriver.assignedVehicle !== user.driverProfile.assignedVehicle) {
          existingDriver.assignedVehicle = user.driverProfile.assignedVehicle;
          await existingDriver.save();
          console.log(`🔗 Updated assignedVehicle for Driver ${existingDriver.name}`);
        }
      }
    }

    // 2. Find all Drivers and ensure they are in User collection
    const allDrivers = await Driver.find();
    for (const driver of allDrivers) {
      const existingUser = await User.findOne({ username: driver.phone });
      
      if (!existingUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('TN@pass123', salt);

        const newUser = new User({
          username: driver.phone,
          email: `${driver.phone}@transitnode.demo`,
          password: hashedPassword,
          name: driver.name,
          role: 'DRIVER',
          isActive: true,
          driverProfile: {
            fullName: driver.name,
            licenseNumber: driver.licenseNumber,
            phoneNumber: driver.phone,
            assignedVehicle: driver.assignedVehicle
          }
        });
        await newUser.save();
        console.log(`👤 Synced Driver ${driver.name} to User collection.`);
      } else {
        // Sync assignedVehicle to User
        if (driver.assignedVehicle && existingUser.driverProfile?.assignedVehicle !== driver.assignedVehicle) {
          existingUser.driverProfile.assignedVehicle = driver.assignedVehicle;
          await existingUser.save();
          console.log(`🔗 Updated assignedVehicle for User ${existingUser.name}`);
        }
      }
    }

    console.log('🎉 Synchronization complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    process.exit(1);
  }
};

syncExistingDrivers();
