const mongoose = require('mongoose');
const Company = require('./src/models/NoSQL/Company');
const ShipmentLedger = require('./src/models/NoSQL/ShipmentLedger');
const Tenant = require('./src/models/NoSQL/Tenant'); // needed if ref is used
require('dotenv').config();

const uri = process.env.MONGO_URI_LOCALHOST;

async function run() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies`);

    for (const company of companies) {
      console.log(`Updating shipments for company: ${company.companyName}`);
      const res = await ShipmentLedger.updateMany(
        { 'logistics.sender.company': company.companyName },
        { $set: { 'logistics.sender.companyAddress': company.address } }
      );
      console.log(`Updated ${res.modifiedCount} shipments for ${company.companyName}`);
    }

    console.log('Migration completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
