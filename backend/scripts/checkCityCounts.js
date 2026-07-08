require('dotenv').config();
const mongoose = require('mongoose');
const Listing = require('../models/listing');

(async () => {
  await mongoose.connect(process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest');

  const rows = await Listing.aggregate([
    {
      $group: {
        _id: { location: '$location', country: '$country' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.location': 1 } },
  ]);

  const total = rows.reduce((sum, row) => sum + row.count, 0);
  console.log('total:', total);
  rows.forEach((row) => {
    console.log(`${row._id.location}, ${row._id.country}: ${row.count}`);
  });

  await mongoose.disconnect();
})().catch(async (err) => {
  console.error(err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
