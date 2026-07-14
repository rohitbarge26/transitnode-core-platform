const Supplier = require('../models/NoSQL/Supplier');
const User = require('../models/NoSQL/User');
const Tenant = require('../models/NoSQL/Tenant');

exports.createSupplier = async (req, res) => {
  try {
    const { 
      supplierName, gstin, pan, address, locationCode, state, stateCode,
      identifierType, supportedBillingCycles, supportedInvoiceTypes, mobileNumber, emailId
    } = req.body;
    
    // Verify Tenant Plan
    console.log('CREATE SUPPLIER - req.user:', req.user);
    const tenantId = req.user.tenantId || (req.user.user && req.user.user.tenantId);
    if (!tenantId) {
      return res.status(401).json({ error: 'Tenant context could not be resolved from token', userPayload: req.user });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant context could not be resolved' });
    }

    if (!['PLATINUM', 'LIFETIME'].includes(tenant.planType)) {
      return res.status(403).json({ 
        error: 'This feature requires a PLATINUM or LIFETIME subscription. Please upgrade your plan to add Suppliers.' 
      });
    }

    // Get active workspace/company from headers via verifyToken middleware
    const companyId = req.workspaceId || null;

    if (!supplierName) {
      return res.status(400).json({ error: 'Supplier name is required' });
    }

    const supplier = new Supplier({
      supplierName,
      gstin,
      pan,
      address,
      locationCode,
      state,
      stateCode,
      identifierType,
      mobileNumber,
      emailId,
      supportedBillingCycles,
      supportedInvoiceTypes,
      tenantId: tenant._id,
      companyId: companyId
    });

    await supplier.save();
    return res.status(201).json({ message: 'Supplier created successfully', supplier });

  } catch (error) {
    console.error('Error creating supplier:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getSuppliers = async (req, res) => {
  try {
    console.log('GET SUPPLIERS - req.user:', req.user);
    const tenantId = req.user.tenantId || (req.user.user && req.user.user.tenantId);
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized: No tenant in token', userPayload: req.user });

    const companyId = req.workspaceId;
    const query = { tenantId: tenantId };
    
    if (companyId) {
      query.companyId = companyId;
    }

    const suppliers = await Supplier.find(query).sort({ createdAt: -1 });
    return res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || (req.user.user && req.user.user.tenantId);
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized: No tenant in token' });

    const supplier = await Supplier.findOne({ _id: id, tenantId });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    const { 
      supplierName, gstin, pan, address, locationCode, state, stateCode,
      identifierType, supportedBillingCycles, supportedInvoiceTypes, mobileNumber, emailId
    } = req.body;

    if (supplierName) supplier.supplierName = supplierName;
    if (gstin !== undefined) supplier.gstin = gstin;
    if (pan !== undefined) supplier.pan = pan;
    if (address) supplier.address = address;
    if (locationCode !== undefined) supplier.locationCode = locationCode;
    if (state !== undefined) supplier.state = state;
    if (stateCode !== undefined) supplier.stateCode = stateCode;
    if (identifierType !== undefined) supplier.identifierType = identifierType;
    if (mobileNumber !== undefined) supplier.mobileNumber = mobileNumber;
    if (emailId !== undefined) supplier.emailId = emailId;
    if (supportedBillingCycles !== undefined) supplier.supportedBillingCycles = supportedBillingCycles;
    if (supportedInvoiceTypes !== undefined) supplier.supportedInvoiceTypes = supportedInvoiceTypes;

    await supplier.save();
    return res.status(200).json({ message: 'Supplier updated successfully', supplier });
  } catch (error) {
    console.error('Error updating supplier:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId || (req.user.user && req.user.user.tenantId);
    if (!tenantId) return res.status(401).json({ error: 'Unauthorized: No tenant in token' });

    const supplier = await Supplier.findOneAndDelete({ _id: id, tenantId });
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    return res.status(200).json({ message: 'Supplier deleted successfully' });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};
