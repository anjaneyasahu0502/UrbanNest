require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

async function dropMobileIndex() {
  console.log('\n🔧 Dropping stale mobile_1 index from users collection\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.connect(MONGO_URL);
  console.log('✓ Connected to DB:', MONGO_URL);

  const db = mongoose.connection.db;
  const collection = db.collection('users');

  // List all current indexes
  const indexes = await collection.indexes();
  console.log('\nCurrent indexes:');
  indexes.forEach(idx => console.log(' -', idx.name, '→', JSON.stringify(idx.key)));

  // Drop mobile_1 if it exists
  const hasMobileIndex = indexes.some(idx => idx.name === 'mobile_1');

  if (hasMobileIndex) {
    await collection.dropIndex('mobile_1');
    console.log('\n✅ Dropped mobile_1 index successfully.');
  } else {
    console.log('\nℹ️  mobile_1 index not found — nothing to drop.');
  }

  // Show indexes after
  const updatedIndexes = await collection.indexes();
  console.log('\nIndexes after cleanup:');
  updatedIndexes.forEach(idx => console.log(' -', idx.name, '→', JSON.stringify(idx.key)));

  await mongoose.disconnect();
  console.log('\n✓ Done.\n');
}

dropMobileIndex().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
