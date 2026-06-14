const Tenant = require('../models/NoSQL/Tenant');
const User = require('../models/NoSQL/User');
const crypto = require('crypto');

exports.registerTenant = async (req, res) => {
  try {
    const { companyName, registeredMobile, customSubdomain } = req.body;

    if (!companyName || !registeredMobile || !customSubdomain) {
      return res.status(400).json({ error: 'companyName, registeredMobile, and customSubdomain are required' });
    }

    // Check if subdomain exists
    const existingTenant = await Tenant.findOne({ customSubdomain });
    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain is already registered' });
    }

    // Set 10 days expiry
    const licenseExpiresAt = new Date();
    licenseExpiresAt.setDate(licenseExpiresAt.getDate() + 10);

    const newTenant = new Tenant({
      companyName,
      registeredMobile,
      customSubdomain,
      planType: 'TRIAL',
      licenseExpiresAt,
    });

    await newTenant.save();

    const bcrypt = require('bcrypt');
    const fallbackPassword = crypto.randomBytes(16).toString('hex'); // Long secure fallback
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(fallbackPassword, salt);
    
    const magicToken = crypto.randomBytes(32).toString('hex');
    const magicLinkExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const newAdmin = new User({
      tenantId: newTenant._id,
      username: registeredMobile,
      email: `admin@${customSubdomain}.corematrix.in`,
      mobileNumber: registeredMobile,
      password: hashedPassword,
      name: `Admin - ${companyName}`,
      role: 'ADMIN',
      magicLinkToken: magicToken,
      magicLinkExpires: magicLinkExpires
    });

    await newAdmin.save();

    // MOCK EMAIL SENDING
    console.log('\n======================================================');
    console.log('MOCK EMAIL SENT TO:', `admin@${customSubdomain}.corematrix.in`);
    console.log('SUBJECT: Welcome to CoreMatrix Tech - Your Workspace is Ready');
    console.log('MAGIC LOGIN LINK:');
    console.log(`http://${customSubdomain}.localhost:3000/magic-login/${magicToken}`);
    console.log('======================================================\n');

    return res.status(201).json({
      message: 'Tenant registered successfully. A magic login link has been sent to your email/mobile.',
      tenantId: newTenant._id,
    });
  } catch (error) {
    console.error('Error in registerTenant:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
exports.getTenantProfile = async (req, res) => {
  try {
    const { subdomain } = req.query;
    if (!subdomain) {
      return res.status(400).json({ error: 'Subdomain is required' });
    }

    const tenant = await Tenant.findOne({ customSubdomain: subdomain });
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    // Verify license status
    const now = new Date();
    if (tenant.licenseExpiresAt && tenant.licenseExpiresAt < now) {
      return res.status(403).json({ error: 'Tenant subscription has expired or is suspended' });
    }

    return res.status(200).json({
      tenantId: tenant._id,
      companyName: tenant.companyName,
      customSubdomain: tenant.customSubdomain,
      planType: tenant.planType,
      // Default theme settings (can be expanded later via db)
      themeColorHex: '#0d9488', // teal-600 default
      logoAssetString: 'default_tenant_logo',
    });
  } catch (error) {
    console.error('Error in getTenantProfile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
