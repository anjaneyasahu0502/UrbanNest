const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/user');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

async function migrateUsers() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');

    // Find all users without email field or with mobile field
    const users = await User.find({});

    console.log(`Found ${users.length} users to check`);

    for (const user of users) {
      let needsUpdate = false;
      
      // Set default email if missing
      if (!user.email) {
        user.email = `${user.username}@example.com`;
        needsUpdate = true;
      }
      
      // Remove mobile field if it exists
      if (user.mobile !== undefined) {
        user.mobile = undefined;
        needsUpdate = true;
      }
      
      // Remove mobileVerified field if it exists
      if (user.mobileVerified !== undefined) {
        user.mobileVerified = undefined;
        needsUpdate = true;
      }
      
      // Remove mobileOTP field if it exists
      if (user.mobileOTP !== undefined) {
        user.mobileOTP = undefined;
        needsUpdate = true;
      }
      
      // Mark as verified since they're existing users
      if (user.emailVerified === false || user.emailVerified === undefined) {
        user.emailVerified = true;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await user.save();
        console.log(`Migrated user: ${user.username}`);
      }
    }

    console.log('Migration completed successfully');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateUsers();
