const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/NoSQL/User');

exports.register = async (req, res) => {
  try {
    const { email, password, name, role, mobileNumber } = req.body;
    
    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobileNumber: mobileNumber || '---' }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or mobile number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save user
    const newUser = await User.create({
      email,
      mobileNumber,
      password: hashedPassword,
      name,
      role: role || 'RECEPTIONIST'
    });

    res.status(201).json({ message: 'User created successfully', user: { id: newUser._id, email: newUser.email, name: newUser.name, role: newUser.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }

    if (!email && !username) {
      return res.status(400).json({ message: 'Email, Username or Mobile Number is required' });
    }

    // Fetch user by email, username, or mobileNumber
    // We assume 'email' could also contain a mobile number if the user typed it in the email field.
    const queryConditions = [];
    if (email) {
      queryConditions.push({ email });
      queryConditions.push({ mobileNumber: email });
    }
    if (username) queryConditions.push({ username });

    const user = await User.findOne({ $or: queryConditions });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const payload = {
      userId: user._id,
      role: user.role,
      tenantId: user.tenantId
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, username: user.username, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

exports.magicLogin = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Magic link token is required' });
    }

    // Find user with this token and ensure it hasn't expired
    const user = await User.findOne({
      magicLinkToken: token,
      magicLinkExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(401).json({ message: 'Magic link is invalid or has expired' });
    }

    // Generate JWT
    const payload = {
      userId: user._id,
      role: user.role,
      tenantId: user.tenantId
    };
    
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    // Invalidate the token so it can't be used again
    user.magicLinkToken = undefined;
    user.magicLinkExpires = undefined;
    await user.save();

    res.status(200).json({
      message: 'Magic login successful',
      token: jwtToken,
      user: { id: user._id, email: user.email, username: user.username, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Error in magic login:', error);
    res.status(500).json({ message: 'Server error during magic login' });
  }
};
