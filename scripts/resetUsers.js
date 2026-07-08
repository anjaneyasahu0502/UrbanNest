require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

async function main() {
  await mongoose.connect(MONGO_URL);
  const result = await User.deleteMany({});
  console.log(`Deleted ${result.deletedCount} user account(s)`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('Failed to delete users:', err.message);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
