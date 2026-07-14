const axios = require('axios');
const mongoose = require('mongoose');

async function testApi() {
  await mongoose.connect('mongodb+srv://sarthaksavdekar:2Fv9kttmZ5F30Qo8@cluster0.s2xku84.mongodb.net/transitnode?retryWrites=true&w=majority&appName=Cluster0');
  
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  const user = await User.findOne({ role: 'ADMIN', tenantId: '6a2ceb4f45ee62edb2eebf72' });
  
  // Create a JWT token for testing locally (just need to know the secret)
  const jwt = require('jsonwebtoken');
  const token = jwt.sign(
    { userId: user._id, role: user.role, tenantId: user.tenantId },
    process.env.JWT_SECRET || 'transitnode_super_secret_key_2024',
    { expiresIn: '24h' }
  );

  try {
    const res = await axios.get('http://localhost:3000/api/admin/subscription', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Response:', res.data);
  } catch (error) {
    console.error('API Error:', error.response ? error.response.data : error.message);
  }
  process.exit(0);
}

testApi();
