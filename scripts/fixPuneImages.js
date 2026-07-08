const mongoose = require('mongoose');
require('dotenv').config();
const Listing = require('../models/listing');
const pexels = require('../utils/pexels');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

const PUNE_NEIGHBORHOODS = [
  'Koregaon Park',
  'Hinjewadi',
  'Viman Nagar',
  'Baner',
  'Kharadi',
  'Aundh',
  'FC Road',
  'Senapati Bapat Road',
];

async function chooseUrbanImageForListing(listing) {
  const base = `${listing.location}, ${listing.country}`;
  const title = listing.title || '';

  // Try title-aware query first
  const tries = [];
  if (title) tries.push({ q: base, title });

  // Use neighborhood-focused queries
  for (const n of PUNE_NEIGHBORHOODS) {
    tries.push({ q: `${n}, Pune, India`, title });
    tries.push({ q: `Pune ${n} skyline`, title });
    tries.push({ q: `Pune ${n} luxury neighborhood`, title });
  }

  // General urban fallbacks
  tries.push({ q: 'Pune skyline', title });
  tries.push({ q: 'Pune downtown skyline', title });
  tries.push({ q: 'Pune modern district skyline', title });

  for (const t of tries) {
    try {
      const url = await pexels.getImageForQuery(t.q, 3, { title: t.title });
      if (url) return url;
    } catch (e) {
      // ignore and continue
      continue;
    }
  }

  return null;
}

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log('connected to DB');

  const listings = await Listing.find({ location: 'Pune' }).select('_id title image.url').lean();
  console.log(`Found ${listings.length} Pune listings`);

  let updated = 0;
  for (const l of listings) {
    try {
      const newUrl = await chooseUrbanImageForListing(l);
      if (newUrl && newUrl !== (l.image && l.image.url)) {
        await Listing.updateOne({ _id: l._id }, { $set: { 'image.url': newUrl } });
        updated += 1;
        console.log(`Updated ${l.title} -> ${newUrl}`);
      }
    } catch (e) {
      console.error('error', l._id, e.message || e);
    }
  }

  console.log(`done, updated ${updated} listings`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
