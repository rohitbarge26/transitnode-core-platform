const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const Tenant = require('../src/models/NoSQL/Tenant');
const User = require('../src/models/NoSQL/User');
const SubscriptionTransaction = require('../src/models/NoSQL/SubscriptionTransaction');

// Target subdomains to remove as shown in user's image
const TARGET_SUBDOMAINS = [
  'inc',
  'data',
  'emirates',
  'shreesha',
  'shradhha',
  'server',
  'versal',
  'silvertransport',
  'manualcargotransport-2054',
  'patil'
];

const removeTargetTenants = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    // Find tenants matching target subdomains
    const tenantsToDelete = await Tenant.find({ customSubdomain: { $in: TARGET_SUBDOMAINS } });
    console.log(`Found ${tenantsToDelete.length} target tenants to delete.`);

    if (tenantsToDelete.length === 0) {
      console.log('No matching tenants found for deletion.');
      return;
    }

    const tenantIds = tenantsToDelete.map(t => t._id);

    // 1. Delete associated users
    const usersDelete = await User.deleteMany({ tenantId: { $in: tenantIds } });
    console.log(`Deleted ${usersDelete.deletedCount} associated users.`);

    // 2. Delete associated transactions
    const txsDelete = await SubscriptionTransaction.deleteMany({ tenantId: { $in: tenantIds } });
    console.log(`Deleted ${txsDelete.deletedCount} associated subscription transactions.`);

    // 3. Optional collections cleanup if existing
    const collectionNames = ['companies', 'suppliers', 'drivers', 'fleets', 'ratecards', 'runsheets', 'telemetrylogs', 'vendorratecards'];
    const db = mongoose.connection.db;

    for (const name of collectionNames) {
      try {
        const col = db.collection(name);
        const res = await col.deleteMany({ tenantId: { $in: tenantIds } });
        if (res.deletedCount > 0) {
          console.log(`Deleted ${res.deletedCount} records from collection: ${name}`);
        }
      } catch (err) {
        // Skip if collection doesn't exist
      }
    }

    // 4. Delete the Tenant documents
    const tenantsDelete = await Tenant.deleteMany({ _id: { $in: tenantIds } });
    console.log(`Deleted ${tenantsDelete.deletedCount} target tenants.`);

    console.log('Target tenant deletion completed successfully!');

  } catch (error) {
    console.error('Error removing target tenants:', error);
  } fontally: {
    // End
  }
};

const execute = async () => {
  try {
    await removeTargetTenants();
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

execute();
