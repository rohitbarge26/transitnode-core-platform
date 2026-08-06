const Company = require('../models/NoSQL/Company');
const Tenant = require('../models/NoSQL/Tenant');

const addSisterCompany = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    const { 
      companyName, gstin, pan, address, state, stateCode, contactNumber,
      identifierType, supportedBillingCycles, supportedInvoiceTypes
    } = req.body;

    if (!companyName || !address) {
      return res.status(400).json({ success: false, message: 'Company Name and Address are required.' });
    }

    const newCompany = new Company({
      tenantId,
      companyName,
      gstin,
      pan,
      address,
      state,
      stateCode,
      contactNumber,
      identifierType,
      supportedBillingCycles,
      supportedInvoiceTypes,
      isActive: true,
      customInvoiceTemplateUrl: req.file ? `/uploads/${req.file.filename}` : null,
    });

    await newCompany.save();

    res.status(201).json({
      success: true,
      message: 'Sister company created successfully',
      company: newCompany,
    });
  } catch (error) {
    console.error('Create Sister Company Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while creating company' });
  }
};

const getWorkspaces = async (req, res) => {
  try {
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing tenant ID' });
    }

    const tenant = await Tenant.findById(tenantId);
    let workspaces = await Company.find({ tenantId });
    
    // Convert Mongoose docs to objects and filter out any accidental duplicate Company records matching Primary HQ name
    workspaces = workspaces.map(w => w.toObject()).filter(w => 
      !tenant || w.companyName.trim().toLowerCase() !== tenant.companyName.trim().toLowerCase()
    );

    if (tenant) {
      // Prepend Main HQ to the list
      workspaces.unshift({
        _id: tenant._id,
        companyName: `${tenant.companyName} (Main HQ)`,
        address: tenant.address,
        state: tenant.state,
        stateCode: tenant.stateCode,
        gstin: tenant.gstin,
        pan: tenant.pan,
        contactNumber: (tenant.contactNumber && tenant.contactNumber.trim() !== '') ? tenant.contactNumber.trim() : tenant.registeredMobile,
        requireDriverMobileApp: tenant.requireDriverMobileApp,
        isMainTenant: true
      });
    }
    
    res.status(200).json({
      success: true,
      workspaces
    });
  } catch (error) {
    console.error('Get Workspaces Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error fetching workspaces' });
  }
};

const updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;
    
    const { 
      companyName, gstin, pan, address, state, stateCode, contactNumber,
      identifierType, supportedBillingCycles, supportedInvoiceTypes, requireDriverMobileApp
    } = req.body;

    const company = await Company.findOne({ _id: id, tenantId });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    if (companyName) company.companyName = companyName;
    if (gstin) company.gstin = gstin;
    if (pan !== undefined) company.pan = pan;
    if (address) company.address = address;
    if (state !== undefined) company.state = state;
    if (stateCode !== undefined) company.stateCode = stateCode;
    if (contactNumber) company.contactNumber = contactNumber;
    if (identifierType !== undefined) company.identifierType = identifierType;
    if (supportedBillingCycles !== undefined) company.supportedBillingCycles = supportedBillingCycles;
    if (supportedInvoiceTypes !== undefined) company.supportedInvoiceTypes = supportedInvoiceTypes;
    if (requireDriverMobileApp !== undefined) company.requireDriverMobileApp = requireDriverMobileApp;

    await company.save();

    res.status(200).json({ success: true, message: 'Company updated successfully', company });
  } catch (error) {
    console.error('Update Company Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while updating company' });
  }
};

const deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    const company = await Company.findOneAndDelete({ _id: id, tenantId });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete Company Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while deleting company' });
  }
};

const updateInvoiceFormat = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user?.tenantId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded. Please upload a valid PDF template.' });
    }

    const company = await Company.findOne({ _id: id, tenantId });
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found or unauthorized' });
    }

    company.customInvoiceTemplateUrl = `/uploads/${req.file.filename}`;
    await company.save();

    res.status(200).json({ success: true, message: 'Invoice template updated successfully', customInvoiceTemplateUrl: company.customInvoiceTemplateUrl });
  } catch (error) {
    console.error('Update Invoice Format Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error while updating invoice format' });
  }
};

module.exports = {
  addSisterCompany,
  getWorkspaces,
  updateCompany,
  deleteCompany,
  updateInvoiceFormat
};
