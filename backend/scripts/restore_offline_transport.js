const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant = require('../src/models/NoSQL/Tenant');
const SubscriptionTransaction = require('../src/models/NoSQL/SubscriptionTransaction');

const restoreOfflineTransport = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const offlineTenant = await Tenant.findOne({
      $or: [
        { customSubdomain: 'offlinetransportpvtltd-7731' },
        { companyName: /Offline Transport/i }
      ]
    });

    if (offlineTenant) {
      offlineTenant.paymentStatus = 'PAID';
      offlineTenant.planType = 'PLATINUM';
      const licenseExpiresAt = new Date();
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 5);
      offlineTenant.licenseExpiresAt = licenseExpiresAt;
      await offlineTenant.save();
      console.log(`[RESTORE SUCCESS] Restored ${offlineTenant.companyName} (${offlineTenant.customSubdomain}) to PAID.`);

      // Ensure SubscriptionTransaction exists for Offline Transport
      const existingTx = await SubscriptionTransaction.findOne({ tenantId: offlineTenant._id });
      if (!existingTx) {
        await SubscriptionTransaction.create({
          tenantId: offlineTenant._id,
          planType: 'PLATINUM',
          amount: 100000,
          paymentMethod: 'OFFLINE_PAYMENT',
          createdAt: offlineTenant.createdAt || new Date()
        });
        console.log(`[RESTORE SUCCESS] Created SubscriptionTransaction (₹1,00,000.00) for ${offlineTenant.companyName}`);
      } else {
        existingTx.amount = 100000;
        existingTx.planType = 'PLATINUM';
        existingTx.paymentMethod = 'OFFLINE_PAYMENT';
        await existingTx.save();
        console.log(`[RESTORE SUCCESS] Updated SubscriptionTransaction for ${offlineTenant.companyName}`);
      }
    } else {
      console.log('Offline Transport tenant not found.');
    }

  } catch (err) {
    console.error('Error restoring:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

restoreOfflineTransport();
