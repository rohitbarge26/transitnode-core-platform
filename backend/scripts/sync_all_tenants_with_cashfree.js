const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant = require('../src/models/NoSQL/Tenant');
const SubscriptionTransaction = require('../src/models/NoSQL/SubscriptionTransaction');
const { getCashfreeOrder } = require('../src/config/cashfree');

const syncTenants = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const tenants = await Tenant.find({ planType: { $ne: 'TRIAL' } });

    console.log(`\nFound ${tenants.length} non-trial tenants. Verifying status with Cashfree...`);

    for (const t of tenants) {
      if (t.planType === 'LIFETIME') {
        console.log(`- ${t.companyName} (${t.customSubdomain}): LIFETIME plan -> PAID`);
        t.paymentStatus = 'PAID';
        await t.save();
        continue;
      }

      const orderId = `order_tenant_${t._id}`;
      try {
        const cfOrder = await getCashfreeOrder(orderId);
        const cfStatus = cfOrder?.order_status;
        console.log(`- ${t.companyName} (${t.customSubdomain}) [Order: ${orderId}]: Cashfree Status = "${cfStatus}"`);

        if (cfStatus === 'PAID') {
          t.paymentStatus = 'PAID';
          await t.save();
          console.log(`  => Saved as PAID in DB.`);
        } else {
          t.paymentStatus = 'PENDING';
          await t.save();
          // Remove unearned transaction
          await SubscriptionTransaction.deleteMany({ tenantId: t._id });
          console.log(`  => Saved as PENDING in DB (unpaid on Cashfree).`);
        }
      } catch (err) {
        console.log(`- ${t.companyName} (${t.customSubdomain}) [Order: ${orderId}]: Order not found or error: ${err.message}`);
        // If order doesn't exist on Cashfree, it was not paid via Cashfree
        t.paymentStatus = 'PENDING';
        await t.save();
        await SubscriptionTransaction.deleteMany({ tenantId: t._id });
        console.log(`  => Saved as PENDING in DB.`);
      }
    }

  } catch (err) {
    console.error('Error during sync:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nSync finished. Disconnected from MongoDB.');
  }
};

syncTenants();
