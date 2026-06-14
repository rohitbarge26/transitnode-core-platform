const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Driver = require('../models/NoSQL/Driver');
const Payroll = require('../models/NoSQL/Payroll');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const seedPayroll = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/transitnode';
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB for Payroll Seeding');

    // Fetch all drivers
    const drivers = await Driver.find();
    if (drivers.length === 0) {
      console.log('⚠️ No drivers found. Please run seedDemoFleet.js first.');
      process.exit(1);
    }

    const monthsToSeed = ['2026-04', '2026-05'];

    for (const driver of drivers) {
      for (const month of monthsToSeed) {
        // Check if payroll already exists to avoid unique index errors
        const existingPayroll = await Payroll.findOne({ employeeId: driver._id.toString(), paymentMonth: month });
        
        if (!existingPayroll) {
          // Generate dummy financial data
          const baseSalary = 25000 + Math.floor(Math.random() * 5000); // 25k - 30k
          const totalAdvances = Math.floor(Math.random() * 5000); // 0 - 5k
          const netPay = baseSalary - totalAdvances;
          const status = month === '2026-04' ? 'PAID' : (Math.random() > 0.5 ? 'PAID' : 'PENDING');

          const newPayroll = new Payroll({
            employeeId: driver._id.toString(),
            employeeName: driver.name,
            role: 'DRIVER',
            paymentMonth: month,
            baseSalary: baseSalary,
            totalAdvances: totalAdvances,
            netPay: netPay,
            status: status,
            paidAt: status === 'PAID' ? new Date(`${month}-10T10:00:00Z`) : null,
          });

          await newPayroll.save();
          console.log(`💰 Generated Payroll for ${driver.name} | Month: ${month} | Net Pay: ₹${netPay} | Status: ${status}`);
        } else {
          console.log(`⚠️ Payroll for ${driver.name} in ${month} already exists. Skipping.`);
        }
      }
    }

    console.log('🎉 Successfully seeded dummy payroll data for all drivers!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during payroll seeding:', error);
    process.exit(1);
  }
};

seedPayroll();
