const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectDB = require('../config/nosql');
const User = require('../models/NoSQL/User');
const Tenant = require('../models/NoSQL/Tenant');
const ShipmentLedger = require('../models/NoSQL/ShipmentLedger');
const Device = require('../models/NoSQL/Device');
const Driver = require('../models/NoSQL/Driver');
const RateCard = require('../models/NoSQL/RateCard');
const Payroll = require('../models/NoSQL/Payroll');
const ComplianceDocument = require('../models/NoSQL/ComplianceDocument');

async function migrate() {
  await connectDB();
  console.log('Connected to DB. Starting migration...');

  // 1. Check if Legacy Tenant exists, if not create one
  let legacyTenant = await Tenant.findOne({ customSubdomain: 'legacy' });
  if (!legacyTenant) {
    legacyTenant = await Tenant.create({
      companyName: 'Legacy Master Company',
      registeredMobile: '0000000000',
      customSubdomain: 'legacy',
      planType: 'PLATINUM',
      licenseExpiresAt: new Date('2099-12-31')
    });
    console.log('Created Legacy Tenant:', legacyTenant._id);
  } else {
    console.log('Found Legacy Tenant:', legacyTenant._id);
  }

  // 2. Assign tenantId to all Users missing it
  const userResult = await User.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: legacyTenant._id } }
  );
  console.log(`Updated ${userResult.modifiedCount} Users.`);

  // 3. Assign tenantId to all Shipments missing it
  const shipResult = await ShipmentLedger.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: legacyTenant._id } }
  );
  console.log(`Updated ${shipResult.modifiedCount} ShipmentLedgers.`);

  // 4. Devices
  const deviceResult = await Device.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: legacyTenant._id } }
  );
  console.log(`Updated ${deviceResult.modifiedCount} Devices.`);

  // 5. Drivers
  const driverResult = await Driver.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: legacyTenant._id } }
  );
  console.log(`Updated ${driverResult.modifiedCount} Drivers.`);

  // 6. RateCards
  const rateResult = await RateCard.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: legacyTenant._id } }
  );
  console.log(`Updated ${rateResult.modifiedCount} RateCards.`);

  // 7. Payrolls
  const payrollResult = await Payroll.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: legacyTenant._id } }
  );
  console.log(`Updated ${payrollResult.modifiedCount} Payrolls.`);

  // 8. ComplianceDocuments
  const complianceResult = await ComplianceDocument.updateMany(
    { tenantId: { $exists: false } },
    { $set: { tenantId: legacyTenant._id } }
  );
  console.log(`Updated ${complianceResult.modifiedCount} ComplianceDocuments.`);

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrate();
