const mongoose = require('mongoose');

async function migrate() {
  await mongoose.connect('mongodb+srv://sarthaksavdekar:2Fv9kttmZ5F30Qo8@cluster0.s2xku84.mongodb.net/transitnode?retryWrites=true&w=majority&appName=Cluster0');
  
  const Tenant = mongoose.model('Tenant', new mongoose.Schema({}, { strict: false }));
  const Company = mongoose.model('Company', new mongoose.Schema({}, { strict: false }));
  
  const tenantRes = await Tenant.updateMany(
    { requireDriverMobileApp: { $exists: false } },
    { $set: { requireDriverMobileApp: false } }
  );
  console.log('Tenants updated:', tenantRes.modifiedCount);

  const companyRes = await Company.updateMany(
    { requireDriverMobileApp: { $exists: false } },
    { $set: { requireDriverMobileApp: false } }
  );
  console.log('Companies updated:', companyRes.modifiedCount);

  process.exit(0);
}

migrate().catch(console.error);
