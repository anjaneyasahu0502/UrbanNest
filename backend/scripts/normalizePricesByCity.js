const mongoose = require('mongoose');
require('dotenv').config();
const Listing = require('../models/listing');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

const cityRanges = {
  'Mumbai': [4500, 9000],
  'Delhi': [3800, 8000],
  'Hyderabad': [3200, 6500],
  'Pune': [2800, 6000],
  'Chennai': [2200, 5200],
  'Kolkata': [1800, 4200],
  'Bengaluru': [3500, 7000]
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('connected to DB');

  const cities = await Listing.distinct('location');
  console.log('Found cities:', cities.join(', '));

  for (const city of cities) {
    const range = cityRanges[city] || [1500, 5000];
    const listings = await Listing.find({ location: city }).select('_id title price');
    console.log(`Processing ${city} (${listings.length} listings) -> range ${range[0]}-${range[1]}`);
    for (const l of listings) {
      const price = randInt(range[0], range[1]);
      await Listing.updateOne({ _id: l._id }, { $set: { price } });
    }
    console.log(`Updated ${listings.length} listings for ${city}`);
  }

  await mongoose.disconnect();
  console.log('done');
}

main().catch(err => { console.error(err); process.exit(1); });
