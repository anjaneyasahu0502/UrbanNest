const mongoose = require('mongoose');
const User = require('../models/user');
require('dotenv').config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

async function main() {
  await mongoose.connect(MONGO_URL);
  try {
    const adminEmail = 'anjaneyasahu0502@gmail.com';
    const adminUsername = 'anjaneya0502';
    const adminPassword = 'b8=Yp&7Fc#0J';

    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      console.log(`Creating new admin: ${adminEmail}...`);
      admin = await User.register(adminUsername, adminEmail, adminPassword);
    } else {
      console.log(`Updating existing user to admin: ${adminEmail}...`);
      const bcrypt = require('bcrypt');
      admin.password = await bcrypt.hash(adminPassword, 12);
      admin.username = adminUsername;
    }

    admin.role = 'admin';
    admin.emailVerified = true;
    await admin.save();
    
    console.log('-----------------------------------');
    console.log('ADMIN SETUP SUCCESSFUL');
    console.log(`Username: ${adminUsername}`);
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('Role:     admin');
    console.log('-----------------------------------');
  } catch (error) {
    console.error('Error setting up admin:', error);
  } finally {
    mongoose.disconnect();
  }
}

main().catch(console.error);
