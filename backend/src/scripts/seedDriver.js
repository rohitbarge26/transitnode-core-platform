const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const User = require('../models/NoSQL/User');

// Load environment variables for MongoDB connection
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedDriver = async () => {
  try {
    // 1. Connect to the database
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitnode';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Database connected for seeding.');

    const targetUsername = '9811122233';
    const plainTextPassword = 'TN@suresh45';

    // 2. Check if the driver user already exists
    const existingDriver = await User.findOne({ username: targetUsername });

    if (existingDriver) {
      console.log(`⚠️ User with username '${targetUsername}' already exists. Seeding skipped.`);
      process.exit(0);
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainTextPassword, salt);

    // 4. Create new Driver User Document
    const newDriver = new User({
      username: targetUsername,
      password: hashedPassword,
      name: 'Suresh Kumar',
      role: 'DRIVER',
      isActive: true,
      driverProfile: {
        fullName: 'Suresh Kumar',
        licenseNumber: 'DL1420260089421',
        phoneNumber: '9811122233',
        assignedVehicle: 'MH-12-QW-1234'
      }
    });

    await newDriver.save();
    console.log(`✅ Successfully seeded mock Driver Role User: ${newDriver.username}`);
    
    // Clean exit
    process.exit(0);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
};

// Execute script
seedDriver();
