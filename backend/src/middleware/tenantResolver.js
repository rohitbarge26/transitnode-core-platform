const Tenant = require('../models/NoSQL/Tenant');

const tenantResolver = async (req, res, next) => {
  try {
    let tenantId = req.headers['x-tenant-id'];
    const hostname = req.hostname;
    
    // Fallback logic to resolve by customSubdomain if header is missing
    if (!tenantId && hostname && hostname !== 'localhost') {
      const parts = hostname.split('.');
      if (parts.length > 2) {
        // e.g. shree.transitnode.in -> subdomain is 'shree'
        const customSubdomain = parts[0];
        const tenant = await Tenant.findOne({ customSubdomain });
        if (tenant) {
          tenantId = tenant._id.toString();
        }
      }
    }

    if (!tenantId) {
      // In some routes like login, maybe tenantId isn't needed or is passed differently,
      // but the instructions imply intercepting execution if it fails later or requiring it.
      // We will let it pass or attach a warning. The user says "The logic must read the tenant mapping via an incoming header key ('x-tenant-id') or hostname parsing matrix... Extract tracking tenant instance record from MongoDB and compare..."
      // Let's assume tenantId is required for this middleware.
      return res.status(401).json({ error: 'Tenant context could not be resolved' });
    }

    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const currentTimestamp = new Date();
    if (currentTimestamp >= tenant.licenseExpiresAt) {
      return res.status(403).json({ 
        error: 'Subscription License Expired. Access Denied. Please navigate to the pricing portal to choose a Silver or Platinum package.' 
      });
    }

    // Attach tenant to request for downstream usage
    req.tenant = tenant;
    next();
  } catch (error) {
    console.error('Error in tenantResolver middleware:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = tenantResolver;
