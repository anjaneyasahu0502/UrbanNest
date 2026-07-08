const mongoose = require('mongoose');
const Listing = require('../models/listing');
const User = require('../models/user');

const MONGO_URL = 'mongodb://127.0.0.1:27017/urbannest';

async function main() {
  await mongoose.connect(MONGO_URL);
  try {
    const admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      console.error('Admin user not found. Run `node scripts/createAdmin.js` first.');
      process.exit(1);
    }

    const filter = { $or: [ { author: { $exists: false } }, { author: null } ] };
    const update = { $set: { author: admin._id } };

    const res = await Listing.updateMany(filter, update);
    console.log(`Matched: ${res.matchedCount}, Modified: ${res.modifiedCount}`);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(console.error);
