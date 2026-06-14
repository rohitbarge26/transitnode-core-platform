const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/NoSQL/User');
dotenv.config({ path: './.env' });
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const users = await User.find({}, {email: 1, role: 1, username: 1, name: 1});
  console.log(users);
  process.exit(0);
});
