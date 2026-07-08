require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing');
const pexels = require('../utils/pexels');

async function main() {
    const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';
    await mongoose.connect(MONGO_URL);
    console.log('connected to DB');

    // group by city+country
    const groups = await Listing.aggregate([
        { $group: { _id: { location: '$location', country: '$country' }, count: { $sum: 1 } } },
        { $sort: { '_id.location': 1 } },
    ]);

    for (const g of groups) {
        const city = g._id.location;
        const country = g._id.country;
        const query = `${city}${country ? ', ' + country : ''}`;
        console.log(`Processing ${query} (${g.count} listings)`);

        let imageUrl = null;
        try {
            imageUrl = await pexels.getImageForQuery(query, 1);
            if (!imageUrl) imageUrl = await pexels.getImageForQuery(city, 1);
        } catch (err) {
            console.error('pexels error for', query, err && err.message);
            imageUrl = null;
        }

        if (!imageUrl) {
            console.log(`No image found for ${query}, skipping.`);
            continue;
        }

        const res = await Listing.updateMany(
            { location: city, country: country },
            { $set: { 'image.url': imageUrl } }
        );
        console.log(`Updated ${res.matchedCount || res.nModified || res.modifiedCount || 0} listings for ${query}`);
    }

    await mongoose.disconnect();
    console.log('done');
}

main().catch((err) => {
    console.error(err && err.message);
    process.exit(1);
});
