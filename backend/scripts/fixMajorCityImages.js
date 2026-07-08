const mongoose = require('mongoose');
require('dotenv').config();
const Listing = require('../models/listing');
const pexels = require('../utils/pexels');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

// Define posh neighborhoods for each city
const CITY_NEIGHBORHOODS = {
  'Delhi': [
    'Connaught Place',
    'Aerocity',
    'Cyber City Gurgaon',
    'Golf Course Road',
    'DLF Phase',
    'Vasant Vihar',
    'Greater Kailash',
    'Saket',
  ],
  'Mumbai': [
    'Bandra Kurla Complex',
    'Lower Parel',
    'Worli',
    'Powai',
    'Andheri East',
    'Nariman Point',
    'Marine Drive',
    'Juhu',
  ],
  'Bengaluru': [
    'Whitefield',
    'Electronic City',
    'Koramangala',
    'Indiranagar',
    'MG Road',
    'UB City',
    'Manyata Tech Park',
    'Outer Ring Road',
  ],
  'Kolkata': [
    'Salt Lake',
    'New Town',
    'Park Street',
    'Ballygunge',
    'Alipore',
    'Rajarhat',
    'EM Bypass',
    'Sector V',
  ],
  'Chennai': [
    'OMR',
    'Nungambakkam',
    'Anna Nagar',
    'Velachery',
    'Adyar',
    'T Nagar',
    'Guindy',
    'Sholinganallur',
  ],
  'Hyderabad': [
    'HITEC City',
    'Gachibowli',
    'Banjara Hills',
    'Jubilee Hills',
    'Madhapur',
    'Financial District',
    'Kondapur',
    'Hitech City',
  ],
};

async function chooseUrbanImageForListing(listing) {
  const city = listing.location;
  const country = listing.country || 'India';
  const base = `${city}, ${country}`;
  const title = listing.title || '';
  const neighborhoods = CITY_NEIGHBORHOODS[city] || [];

  const tries = [];

  // Title-aware queries for luxury/modern properties
  if (title.toLowerCase().includes('luxury') || title.toLowerCase().includes('lux')) {
    tries.push({ q: `${city} luxury high rise building`, title });
    tries.push({ q: `${city} luxury apartment building`, title });
    tries.push({ q: `${city} upscale neighborhood`, title });
  }
  
  if (title.toLowerCase().includes('modern') || title.toLowerCase().includes('loft')) {
    tries.push({ q: `${city} modern skyscraper`, title });
    tries.push({ q: `${city} contemporary architecture`, title });
  }

  if (title.toLowerCase().includes('city view') || title.toLowerCase().includes('view')) {
    tries.push({ q: `${city} skyline night`, title });
    tries.push({ q: `${city} city skyline`, title });
  }

  // Neighborhood-focused queries for posh localities
  for (const n of neighborhoods) {
    tries.push({ q: `${n}, ${city}`, title });
    tries.push({ q: `${city} ${n} skyline`, title });
    tries.push({ q: `${city} ${n} high rise`, title });
  }

  // General urban/high-rise queries
  tries.push({ q: `${city} skyline`, title });
  tries.push({ q: `${city} skyscraper`, title });
  tries.push({ q: `${city} high rise buildings`, title });
  tries.push({ q: `${city} downtown skyline`, title });
  tries.push({ q: `${city} business district`, title });
  tries.push({ q: `${city} modern architecture`, title });
  tries.push({ q: `${city} luxury apartments`, title });
  tries.push({ q: `${city} urban cityscape`, title });
  tries.push({ q: `${city} aerial view`, title });

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

  const cities = Object.keys(CITY_NEIGHBORHOODS);
  let totalUpdated = 0;

  for (const city of cities) {
    console.log(`\n=== Processing ${city} ===`);
    const listings = await Listing.find({ location: city }).select('_id title image.url').lean();
    console.log(`Found ${listings.length} ${city} listings`);

    let updated = 0;
    for (const l of listings) {
      try {
        const newUrl = await chooseUrbanImageForListing(l);
        if (newUrl && newUrl !== (l.image && l.image.url)) {
          await Listing.updateOne({ _id: l._id }, { $set: { 'image.url': newUrl } });
          updated += 1;
          console.log(`Updated ${l.title} -> ${newUrl.substring(0, 80)}...`);
        }
      } catch (e) {
        console.error('error', l._id, e.message || e);
      }
    }

    console.log(`${city}: updated ${updated} listings`);
    totalUpdated += updated;
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Total updated: ${totalUpdated} listings across ${cities.length} cities`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error(err); process.exit(1); });
