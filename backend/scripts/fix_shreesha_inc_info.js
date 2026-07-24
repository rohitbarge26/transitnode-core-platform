const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant = require('../src/models/NoSQL/Tenant');
const SubscriptionTransaction = require('../src/models/NoSQL/SubscriptionTransaction');

const fixShreeshaIncInfo = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    // 1. Find Shreesha Inc Info (subdomain: inc-info)
    const targetTenant = await Tenant.findOne({
      $or: [
        { customSubdomain: 'inc-info' },
        { companyName: /Shreesha Inc Info/i }
      ]
    });

    if (targetTenant) {
      targetTenant.paymentStatus = 'PAID';
      targetTenant.planType = 'PLATINUM';
      const licenseExpiresAt = new Date();
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 5);
      targetTenant.licenseExpiresAt = licenseExpiresAt;
      await targetTenant.save();
      console.log(`[FIX SUCCESS] Updated ${targetTenant.companyName} (${targetTenant.customSubdomain}) to PAID - PLATINUM.`);

      // Ensure SubscriptionTransaction exists for Shreesha Inc Info
      const existingTx = await SubscriptionTransaction.findOne({ tenantId: targetTenant._id });
      if (!existingTx) {
        await SubscriptionTransaction.create({
          tenantId: targetTenant._id,
          planType: 'PLATINUM',
          amount: 100000,
          paymentMethod: 'CASHFREE_GATEWAY',
          createdAt: targetTenant.createdAt || new Date()
        });
        console.log(`[FIX SUCCESS] Created SubscriptionTransaction (₹1,00,000.00) for ${targetTenant.companyName}`);
      } else {
        existingTx.amount = 100000;
        existingTx.planType = 'PLATINUM';
        existingTx.paymentMethod = 'CASHFREE_GATEWAY';
        await existingTx.save();
        console.log(`[FIX SUCCESS] Updated existing SubscriptionTransaction for ${targetTenant.companyName}`);
      }
    } else {
      console.log('Shreesha Inc Info tenant not found.');
    }

    // 2. Find Shreesha Inc (subdomain: shreesha-inc) - set to PENDING if not paid
    const otherTenant = await Tenant.findOne({
      customSubdomain: 'shreesha-inc'
    });
    if (otherTenant) {
      otherTenant.paymentStatus = 'PENDING';
      await otherTenant.save();
      await SubscriptionTransaction.deleteMany({ tenantId: otherTenant._id });
      console.log(`[FIX SUCCESS] Updated ${otherTenant.companyName} (${otherTenant.customSubdomain}) to PENDING.`);
    }

  } catch (err) {
    console.error('Error fixing tenants:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

fixShreeshaIncInfo();
