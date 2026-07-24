const User = require('../models/NoSQL/User');
const bcrypt = require('bcrypt');

// GET /api/users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ tenantId: req.user.tenantId }, '-password').sort({ createdAt: -1 });
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// GET /api/users/:id
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOne({ _id: id, tenantId: req.user.tenantId }, '-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user details' });
  }
};

// PUT /api/users/:id
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, username, mobileNumber, password } = req.body;
    
    const user = await User.findOne({ _id: id, tenantId: req.user.tenantId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email) user.email = email;
    if (name) user.name = name;
    if (role) user.role = role;
    if (username) user.username = username;
    if (mobileNumber) user.mobileNumber = mobileNumber;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({ 
      message: 'User updated successfully', 
      user: { id: user._id, email: user.email, name: user.name, role: user.role, username: user.username, mobileNumber: user.mobileNumber } 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating user' });
  }
};

// DELETE /api/users/:id
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findOneAndDelete({ _id: id, tenantId: req.user.tenantId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

// POST /api/users/setup-admin
exports.setupAdmin = async (req, res) => {
  try {
    const { username, password, tenantId } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    const Tenant = require('../models/NoSQL/Tenant');
    const jwt = require('jsonwebtoken');

    // 1. Try to authenticate via JWT (Scenario A: Online Checkout / Magic Link)
    let userId = null;
    const authHeader = req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Token invalid, fall back to Scenario B
      }
    }

    // 2. Fallback to tenantId from body (Scenario B: Offline Manual Onboarding)
    const workspaceId = tenantId || req.header('x-workspace-id');

    if (userId) {
      // Scenario A: Existing User logic
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: 'Admin user not found' });
      if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Only ADMIN can perform initial setup' });

      const existingUser = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUser) return res.status(400).json({ message: 'Username is already taken' });

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
      user.username = username;
      await user.save();

      await Tenant.findByIdAndUpdate(user.tenantId, { adminSetupComplete: true });
      return res.status(200).json({ message: 'Admin credentials configured successfully' });

    } else if (workspaceId && workspaceId !== 'MAIN') {
      // Scenario B: Workspace ID provided, update existing or create new admin user
      const tenant = await Tenant.findById(workspaceId);
      if (!tenant) return res.status(404).json({ message: 'Tenant not found' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      let adminUser = await User.findOne({ tenantId: tenant._id, role: 'ADMIN' });
      if (adminUser) {
        adminUser.username = username;
        if (username.includes('@')) adminUser.email = username;
        adminUser.password = hashedPassword;
        await adminUser.save();
      } else {
        adminUser = new User({
          tenantId: tenant._id,
          username,
          email: username.includes('@') ? username : `admin@${tenant.customSubdomain}.prohitcoretech.in`,
          password: hashedPassword,
          name: 'Admin - ' + tenant.companyName,
          role: 'ADMIN'
        });
        await adminUser.save();
      }

      tenant.adminSetupComplete = true;
      tenant.paymentStatus = 'PAID';
      await tenant.save();

      return res.status(200).json({ 
        message: 'Admin credentials configured successfully',
        fullLoginUrl: tenant.fullLoginUrl 
      });

    } else {
      return res.status(401).json({ message: 'Access Denied. Invalid or expired authentication token.' });
    }

  } catch (error) {
    console.error('Error in setupAdmin:', error);
    res.status(500).json({ message: 'Server error during admin setup' });
  }
};
