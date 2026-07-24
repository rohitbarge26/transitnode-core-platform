const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Tenant = require('../src/models/NoSQL/Tenant');
const Company = require('../src/models/NoSQL/Company');

const cleanupDuplicateCompanies = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGO_URI_LOCALHOST;
    console.log('Connecting to MongoDB:', mongoUri);
    await mongoose.connect(mongoUri);

    const tenants = await Tenant.find({});
    console.log(`Checking ${tenants.length} tenants for duplicate primary companies...`);

    let removedCount = 0;
    for (const t of tenants) {
      // Find companies under this tenant that have the exact same companyName as the parent Tenant
      const duplicateCompanies = await Company.find({
        tenantId: t._id,
        companyName: t.companyName
      });

      if (duplicateCompanies.length > 0) {
        for (const comp of duplicateCompanies) {
          await Company.findByIdAndDelete(comp._id);
          removedCount++;
          console.log(`[CLEANUP] Deleted duplicate sister company record "${comp.companyName}" (ID: ${comp._id}) under tenant "${t.companyName}".`);
        }
      }
    }

    console.log(`\nCleanup complete! Removed ${removedCount} duplicate company records.`);

  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

cleanupDuplicateCompanies();
