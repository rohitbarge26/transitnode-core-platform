const Tenant = require('../models/NoSQL/Tenant');
const User = require('../models/NoSQL/User');
const SubscriptionTransaction = require('../models/NoSQL/SubscriptionTransaction');
const crypto = require('crypto');
const { verifyWebhookSignature } = require('../config/cashfree');

exports.registerTenant = async (req, res) => {
  try {
    const { companyName, registeredMobile, customSubdomain, planTier, logoUrl, dominantHexColor, requireDriverMobileApp } = req.body;

    if (!companyName || !registeredMobile || !customSubdomain) {
      return res.status(400).json({ error: 'companyName, registeredMobile, and customSubdomain are required' });
    }

    // Check if subdomain exists
    const existingTenant = await Tenant.findOne({ customSubdomain });
    if (existingTenant) {
      return res.status(400).json({ error: 'Subdomain is already registered' });
    }

    // Check if user with this mobile number already exists
    const existingUser = await User.findOne({ username: registeredMobile });
    if (existingUser) {
      return res.status(400).json({ error: 'A user with this mobile number is already registered' });
    }

    const upperPlanTier = planTier ? planTier.toUpperCase() : 'TRIAL';
    const mappedPlanType = upperPlanTier === 'FREE' ? 'TRIAL' : upperPlanTier;

    // Set 10 days expiry for trial, or 1 day (grace period/unpaid) for paid plans
    const licenseExpiresAt = new Date();
    if (mappedPlanType === 'TRIAL') {
      licenseExpiresAt.setDate(licenseExpiresAt.getDate() + 10);
    } else {
      // 1 day grace period for payment
      licenseExpiresAt.setDate(licenseExpiresAt.getDate() + 1);
    }
    
    // Generate the full login URL dynamically based on environment
    const frontendDomain = process.env.FRONTEND_DOMAIN || 'localhost:3001';
    const protocol = frontendDomain.includes('localhost') ? 'http' : 'https';
    const fullLoginUrl = `${protocol}://${customSubdomain}.${frontendDomain}/login`;

    const newTenant = new Tenant({
      companyName,
      registeredMobile,
      customSubdomain,
      fullLoginUrl,
      planType: mappedPlanType,
      licenseExpiresAt,
      paymentStatus: mappedPlanType === 'TRIAL' ? 'PAID' : 'PENDING',
      requireDriverMobileApp: requireDriverMobileApp || false,
      brandingOptions: {
        logoUrl: logoUrl || null,
        dominantHexColor: dominantHexColor || '#3b82f6',
      }
    });

    await newTenant.save();

    // Create the admin user
    let newAdmin;
    const magicToken = crypto.randomBytes(32).toString('hex');
    try {
      const bcrypt = require('bcrypt');
      const fallbackPassword = crypto.randomBytes(16).toString('hex'); // Long secure fallback
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(fallbackPassword, salt);
      
      const magicLinkExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      newAdmin = new User({
        tenantId: newTenant._id,
        username: registeredMobile,
        email: `admin@${customSubdomain}.prohitcoretech.in`,
        mobileNumber: registeredMobile,
        password: hashedPassword,
        name: `Admin - ${companyName}`,
        role: 'ADMIN',
        magicLinkToken: magicToken,
        magicLinkExpires: magicLinkExpires
      });

      await newAdmin.save();
    } catch (userError) {
      // Clean up the created tenant so the subdomain isn't locked up
      await Tenant.deleteOne({ _id: newTenant._id });
      throw userError;
    }

    // If it's a FREE trial, send magic link and return success immediately
    if (mappedPlanType === 'TRIAL') {
      // MOCK EMAIL SENDING
      console.log('\n======================================================');
      console.log('MOCK EMAIL SENT TO:', `admin@${customSubdomain}.prohitcoretech.in`);
      console.log('SUBJECT: Welcome to PROHIT CoreTech - Your Workspace is Ready');
      console.log(`MAGIC LOGIN LINK:`);
      console.log(`${protocol}://${customSubdomain}.${frontendDomain}/magic-login/${magicToken}`);
      console.log('======================================================\n');

      return res.status(201).json({
        message: 'Tenant registered successfully. A magic login link has been sent to your email/mobile.',
        tenantId: newTenant._id,
        magicLink: `${protocol}://${customSubdomain}.${frontendDomain}/magic-login/${magicToken}`,
        fullLoginUrl: newTenant.fullLoginUrl
      });
    }

    // For paid plans, create Cashfree Order first
    let amount = 0;
    if (mappedPlanType === 'LIFETIME') amount = 500000;
    else if (mappedPlanType === 'PLATINUM') amount = 100000;
    else if (mappedPlanType === 'SILVER') amount = 50000;

    const { createCashfreeOrder } = require('../config/cashfree');
    const orderId = `order_tenant_${newTenant._id}`;
    
    const returnUrl = `${newTenant.fullLoginUrl}?payment_success=true`;

    try {
      const cfOrder = await createCashfreeOrder(
        orderId, 
        amount, 
        {
          id: newTenant._id.toString(),
          phone: registeredMobile,
          name: companyName,
          email: `admin@${customSubdomain}.prohitcoretech.in`,
          subdomain: customSubdomain
        }, 
        returnUrl
      );

      return res.status(201).json({
        message: 'Tenant registration initiated. Complete payment to activate workspace.',
        tenantId: newTenant._id,
        orderSessionId: cfOrder.payment_session_id,
        cfOrderId: cfOrder.order_id,
        requiresPayment: true
      });
    } catch (cfError) {
      console.error('Cashfree order creation failed:', cfError);
      // Clean up the created tenant so they can try again with the same subdomain
      await User.deleteOne({ _id: newAdmin._id });
      await Tenant.deleteOne({ _id: newTenant._id });
      return res.status(500).json({ error: `Payment gateway initialization failed: ${cfError.message}` });
    }
  } catch (error) {
    console.error('Error in registerTenant:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.cashfreeWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-webhook-signature'];
    const timestamp = req.headers['x-webhook-timestamp'];
    const rawBody = req.rawBody;

    if (!verifyWebhookSignature(signature, timestamp, rawBody)) {
      console.error('[CASHFREE WEBHOOK] Invalid webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const { event, data } = req.body;
    console.log(`[CASHFREE WEBHOOK] Event received: ${event}`);

    if (event === 'ORDER_PAID') {
      const orderId = data.order.order_id;
      const amount = data.order.order_amount;
      const paymentMethod = data.payment?.payment_method ? Object.keys(data.payment.payment_method)[0] : 'unknown';

      if (orderId && orderId.startsWith('order_tenant_')) {
        const tenantId = orderId.replace('order_tenant_', '');
        const tenant = await Tenant.findById(tenantId);
        
        if (tenant && tenant.paymentStatus !== 'PAID') {
          // Calculate license expiration based on plan
          const licenseExpiresAt = new Date();
          if (tenant.planType === 'LIFETIME') {
            licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 100);
          } else if (tenant.planType === 'PLATINUM') {
            licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 5);
          } else if (tenant.planType === 'SILVER') {
            licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 3);
          }

          tenant.paymentStatus = 'PAID';
          tenant.licenseExpiresAt = licenseExpiresAt;
          await tenant.save();

          // Create the SubscriptionTransaction record
          const transaction = new SubscriptionTransaction({
            tenantId: tenant._id,
            planType: tenant.planType,
            amount: amount,
            paymentMethod: `CASHFREE_${paymentMethod.toUpperCase()}`
          });
          await transaction.save();
          
          console.log(`[CASHFREE WEBHOOK] Tenant ${tenant.companyName} marked as PAID. Plan: ${tenant.planType}`);
        }
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error in cashfreeWebhook:', error);
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

    // If payment status is PENDING and it is a paid plan, check Cashfree order directly (fallback/local development)
    if (tenant.paymentStatus === 'PENDING' && tenant.planType !== 'TRIAL') {
      try {
        const { getCashfreeOrder } = require('../config/cashfree');
        const orderId = `order_tenant_${tenant._id}`;
        const cfOrder = await getCashfreeOrder(orderId);
        
        if (cfOrder && cfOrder.order_status === 'PAID') {
          const licenseExpiresAt = new Date();
          if (tenant.planType === 'LIFETIME') {
            licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 100);
          } else if (tenant.planType === 'PLATINUM') {
            licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 5);
          } else if (tenant.planType === 'SILVER') {
            licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 3);
          }

          tenant.paymentStatus = 'PAID';
          tenant.licenseExpiresAt = licenseExpiresAt;
          await tenant.save();

          // Create the SubscriptionTransaction record if it doesn't exist
          const SubscriptionTransaction = require('../models/NoSQL/SubscriptionTransaction');
          const existingTx = await SubscriptionTransaction.findOne({ tenantId: tenant._id });
          if (!existingTx) {
            let paymentMethod = 'unknown';
            try {
              const { getCashfreeOrderPayments } = require('../config/cashfree');
              const payments = await getCashfreeOrderPayments(orderId);
              const successPayment = payments && payments.find ? payments.find(p => p.payment_status === 'SUCCESS') : null;
              if (successPayment && successPayment.payment_method) {
                paymentMethod = Object.keys(successPayment.payment_method)[0] || 'unknown';
              }
            } catch (payError) {
              console.error(`[GET PROFILE FALLBACK] Failed to check Cashfree payments list:`, payError.message);
            }
            
            const transaction = new SubscriptionTransaction({
              tenantId: tenant._id,
              planType: tenant.planType,
              amount: cfOrder.order_amount,
              paymentMethod: `CASHFREE_${paymentMethod.toUpperCase()}`
            });
            await transaction.save();
          }

          console.log(`[GET PROFILE FALLBACK] Tenant ${tenant.companyName} dynamically marked as PAID via Cashfree API check.`);
        }
      } catch (cfError) {
        console.error(`[GET PROFILE FALLBACK] Failed to check Cashfree order status for tenant ${tenant._id}:`, cfError.message);
      }
    }

    // Verify license status
    const now = new Date();
    if (tenant.isSuspended) {
      return res.status(403).json({ error: 'Tenant subscription has expired or is suspended' });
    }
    if (tenant.licenseExpiresAt && tenant.licenseExpiresAt < now) {
      return res.status(403).json({ error: 'Tenant subscription has expired or is suspended' });
    }

    return res.status(200).json({
      tenantId: tenant._id,
      companyName: tenant.companyName,
      customSubdomain: tenant.customSubdomain,
      planType: tenant.planType,
      paymentStatus: tenant.paymentStatus,
      adminSetupComplete: tenant.adminSetupComplete,
      // Default theme settings (can be expanded later via db)
      themeColorHex: '#0d9488', // teal-600 default
      logoAssetString: 'default_tenant_logo',
    });
  } catch (error) {
    console.error('Error in getTenantProfile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.processCheckout = async (req, res) => {
  try {
    const { paymentMethod, amount } = req.body;
    // We already have req.user from authGuard
    const tenantId = req.user.tenantId;

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (tenant.paymentStatus === 'PAID') {
      return res.status(400).json({ error: 'Tenant is already marked as PAID' });
    }

    // Extend license based on plan Type
    const licenseExpiresAt = new Date();
    if (tenant.planType === 'LIFETIME') {
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 100);
    } else if (tenant.planType === 'PLATINUM') {
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 5);
    } else if (tenant.planType === 'SILVER') {
      licenseExpiresAt.setFullYear(licenseExpiresAt.getFullYear() + 3);
    } else {
      // Default to +30 days if somehow checkout is hit for a free trial
      licenseExpiresAt.setDate(licenseExpiresAt.getDate() + 30);
    }

    // Update Tenant
    tenant.paymentStatus = 'PAID';
    tenant.licenseExpiresAt = licenseExpiresAt;
    await tenant.save();

    // Record Transaction
    const transaction = new SubscriptionTransaction({
      tenantId: tenant._id,
      planType: tenant.planType,
      amount: amount || 0,
      paymentMethod: paymentMethod || 'unknown'
    });
    await transaction.save();

    return res.status(200).json({ 
      success: true, 
      message: 'Payment processed successfully', 
      licenseExpiresAt 
    });
  } catch (error) {
    console.error('Error in processCheckout:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateTenantProfile = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    console.log('--- DEBUG updateTenantProfile ---');
    console.log('req.user:', req.user);
    console.log('tenantId:', tenantId);
    
    const { companyName, gstin, pan, address, state, stateCode, contactNumber, logoUrl, dominantHexColor, requireDriverMobileApp } = req.body;

    const tenant = await Tenant.findById(tenantId);
    console.log('Found tenant:', tenant ? tenant._id : 'NOT FOUND');
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    if (companyName) tenant.companyName = companyName;
    if (gstin !== undefined) tenant.gstin = gstin;
    if (pan !== undefined) tenant.pan = pan;
    if (address !== undefined) tenant.address = address;
    if (state !== undefined) tenant.state = state;
    if (stateCode !== undefined) tenant.stateCode = stateCode;
    if (contactNumber !== undefined) tenant.contactNumber = contactNumber;
    if (requireDriverMobileApp !== undefined) {
      // Need to convert string 'true'/'false' to boolean since FormData sends strings
      tenant.requireDriverMobileApp = requireDriverMobileApp === 'true' || requireDriverMobileApp === true;
    }
    
    // Update brandingOptions if provided
    if (req.file || logoUrl !== undefined || dominantHexColor !== undefined) {
      tenant.brandingOptions = tenant.brandingOptions || {};
      if (req.file) {
        tenant.brandingOptions.logoUrl = `/uploads/${req.file.filename}`;
      } else if (logoUrl !== undefined) {
        tenant.brandingOptions.logoUrl = logoUrl || null;
      }
      if (dominantHexColor !== undefined) {
        tenant.brandingOptions.dominantHexColor = dominantHexColor || '#3b82f6';
      }
    }

    await tenant.save();

    return res.status(200).json({ success: true, message: 'Primary Workspace updated successfully', tenant });
  } catch (error) {
    console.error('Error in updateTenantProfile:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateInvoiceFormat = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a valid PDF template.' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    tenant.customInvoiceTemplateUrl = `/uploads/${req.file.filename}`;
    await tenant.save();

    return res.status(200).json({ success: true, message: 'Invoice template updated successfully', customInvoiceTemplateUrl: tenant.customInvoiceTemplateUrl });
  } catch (error) {
    console.error('Update Tenant Invoice Format Error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error while updating invoice format' });
  }
};
