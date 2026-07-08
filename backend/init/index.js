require('dotenv').config();
const mongoose = require('mongoose');
const data = require('./data.js');
const Listing = require('../models/listing.js');
const { generateListings } = require('./generateListings.js');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';
const seedMode = process.env.SEED_MODE || 'global';
const fallbackFocusCities = ['Delhi', 'Mumbai', 'Kolkata', 'Chennai', 'Bengaluru', 'Hyderabad', 'Pune'];
const envFocusCities = String(process.env.SEED_FOCUS_CITIES || '')
    .split(',')
    .map((city) => city.trim())
    .filter(Boolean);
const focusCities = envFocusCities.length ? envFocusCities : (seedMode === 'india-metros' ? fallbackFocusCities : []);
const seedCount = Number(process.env.SEED_LISTING_COUNT || (focusCities.length ? 280 : 60));
const defaultCountry = process.env.SEED_DEFAULT_COUNTRY || (focusCities.length ? 'India' : '');

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log('connected to DB');

    await Listing.deleteMany({});

    let listings = [];
    try {
        listings = await generateListings(seedCount, { focusCities, defaultCountry });
        console.log(`generated ${listings.length} listings using API-assisted seeding`);
    } catch (_err) {
        listings = [];
    }

    if (!listings.length) {
        listings = data.data;
        console.log('falling back to local static seed data');
    }

    await Listing.insertMany(listings);
    console.log(`data was initialized (${listings.length} listings)`);
    await mongoose.disconnect();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
