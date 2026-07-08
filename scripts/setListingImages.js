const mongoose = require('mongoose');
require('dotenv').config();
const Listing = require('../models/listing');
const pexels = require('../utils/pexels');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('connected to DB');

  const cursor = Listing.find({}).cursor();
  let count = 0;
  for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
    try {
      const query = `${doc.location}, ${doc.country}`;
      const title = doc.title || '';
      const imageUrl = await pexels.getImageForQuery(query, 1, { title });
      if (imageUrl) {
        await Listing.updateOne({ _id: doc._id }, { $set: { 'image.url': imageUrl } });
        count += 1;
        if (count % 50 === 0) console.log(`Updated ${count} listings so far`);
      }
    } catch (e) {
      // continue on errors
      console.error('error for', doc._id, e.message || e);
    }
  }

  console.log(`done, updated ${count} listings`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
