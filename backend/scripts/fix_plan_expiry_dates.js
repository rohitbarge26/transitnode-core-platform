const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant = require('../src/models/NoSQL/Tenant');

const fixPlanExpiries = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const tenants = await Tenant.find({});
    console.log(`Checking ${tenants.length} tenants to correct plan license expiration dates...`);

    let updatedCount = 0;
    for (const t of tenants) {
      const baseDate = t.createdAt ? new Date(t.createdAt) : new Date();
      const newExpiry = new Date(baseDate);

      if (t.planType === 'SILVER') {
        newExpiry.setFullYear(newExpiry.getFullYear() + 3);
      } else if (t.planType === 'PLATINUM') {
        newExpiry.setFullYear(newExpiry.getFullYear() + 5);
      } else if (t.planType === 'LIFETIME') {
        newExpiry.setFullYear(newExpiry.getFullYear() + 100);
      } else if (t.planType === 'TRIAL') {
        newExpiry.setDate(newExpiry.getDate() + 14);
      }

      t.licenseExpiresAt = newExpiry;
      await t.save();
      updatedCount++;
      console.log(`[EXPIRY FIX] ${t.companyName} (${t.customSubdomain}) [${t.planType}]: Set expiry to ${newExpiry.toISOString().split('T')[0]}`);
    }

    console.log(`\nSuccessfully updated expiry dates for ${updatedCount} tenants.`);

  } catch (err) {
    console.error('Error fixing expiries:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

fixPlanExpiries();
