const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcrypt');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

const ADMIN_EMAIL    = 'anjaneyasahu0502@gmail.com';
const ADMIN_USERNAME = 'anjaneya0502';
const ADMIN_PASSWORD = 'b8=Yp&7Fc#0J';

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('Connected to DB');

  try {
    // Find by email OR username
    let admin = await User.findOne({
      $or: [{ email: ADMIN_EMAIL }, { username: ADMIN_USERNAME }]
    });

    if (!admin) {
      // Create fresh admin
      const hash = await bcrypt.hash(ADMIN_PASSWORD, 12);
      admin = new User({
        username:      ADMIN_USERNAME,
        email:         ADMIN_EMAIL,
        password:      hash,
        role:          'admin',
        emailVerified: true,
      });
      await admin.save();
      console.log(`✅ Created admin account`);
      console.log(`   username : ${ADMIN_USERNAME}`);
      console.log(`   email    : ${ADMIN_EMAIL}`);
      console.log(`   password : ${ADMIN_PASSWORD}`);
    } else {
      // Ensure critical fields are correct
      admin.role          = 'admin';
      admin.emailVerified = true;
      admin.email         = ADMIN_EMAIL;
      admin.username      = ADMIN_USERNAME;
      // Reset password to known value
      admin.password = await bcrypt.hash(ADMIN_PASSWORD, 12);
      await admin.save();
      console.log(`✅ Admin account updated`);
      console.log(`   username : ${ADMIN_USERNAME}`);
      console.log(`   email    : ${ADMIN_EMAIL}`);
      console.log(`   password : ${ADMIN_PASSWORD}`);
    }
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from DB');
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
