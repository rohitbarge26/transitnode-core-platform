const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/NoSQL/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/nosql');

async function fixPassword() {
  await connectDB();
  const mobileNumber = '9561042069';
  const rawPassword = '9d867edf'; // the one that was saved in plain text
  
  const user = await User.findOne({ mobileNumber });
  if (user) {
    console.log('Found user, checking if password is an unhashed string...');
    if (!user.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      user.password = hashedPassword;
      await user.save();
      console.log('Password successfully hashed and saved!');
    } else {
      console.log('Password is already hashed.');
    }
  } else {
    console.log('User not found.');
  }
  process.exit();
}

fixPassword();
