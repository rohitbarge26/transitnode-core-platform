const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant = require('../src/models/NoSQL/Tenant');
const { getCashfreeOrder } = require('../src/config/cashfree');

const inspectTenants = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    await mongoose.connect(mongoUri);

    const tenants = await Tenant.find({
      companyName: { $regex: /Shreesha/i }
    });

    console.log('--- INSPECT SHREESHA TENANTS ---');
    for (const t of tenants) {
      console.log(`\nID: ${t._id}`);
      console.log(`Company: ${t.companyName}`);
      console.log(`Subdomain: ${t.customSubdomain}`);
      console.log(`PlanType: ${t.planType}`);
      console.log(`PaymentStatus in DB: ${t.paymentStatus}`);

      const orderId = `order_tenant_${t._id}`;
      try {
        const cfOrder = await getCashfreeOrder(orderId);
        console.log(`Cashfree Order (${orderId}) status:`, cfOrder.order_status);
      } catch (err) {
        console.log(`Cashfree Order (${orderId}) lookup error:`, err.message);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
};

inspectTenants();
