const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn } = require('../appMiddleware');

function buildMonthGrid(year, month, bookedSet) {
  // month: 0-11
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let week = new Array(startDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().slice(0,10);
    const cell = { date, iso, booked: bookedSet.has(iso) };
    week.push(cell);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

function buildMonthGridForJson(year, month, bookedSet) {
  const firstOfMonth = new Date(year, month, 1);
  const startDay = firstOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [];
  let week = new Array(startDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const iso = date.toISOString().slice(0,10);
    const cell = { day: d, iso, booked: bookedSet.has(iso) };
    week.push(cell);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

router.get('/', isLoggedIn, wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const listings = await Listing.find({ author: userId }).lean();

  // For each listing, fetch bookings and build calendar data for next 3 months
  const now = new Date();
  const monthsToShow = 3;

  const listingCalendars = [];
  for (const listing of listings) {
    const bookings = await Booking.find({ listing: listing._id }).populate('user', 'username email').lean();
    const bookedSet = new Set();
    const bookingsByDate = {};
    bookings.forEach(b => {
      const start = new Date(b.checkIn);
      const end = new Date(b.checkOut);
      for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().slice(0,10);
        bookedSet.add(iso);
        bookingsByDate[iso] = bookingsByDate[iso] || {
          bookingId: String(b._id),
          guestName: (b.user && (b.user.username || b.user.email)) || 'Guest',
          checkIn: b.checkIn,
          checkOut: b.checkOut,
          totalPrice: b.totalPrice,
          paid: b.paid
        };
      }
    });

    const months = [];
    for (let i = 0; i < monthsToShow; i++) {
      const m = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const grid = buildMonthGrid(m.getFullYear(), m.getMonth(), bookedSet);
      months.push({ year: m.getFullYear(), month: m.getMonth(), grid });
    }

    listingCalendars.push({ listing, months, bookingsByDate });
  }

  res.render('bookings/host', { listingCalendars });
}));

// JSON endpoint for a single listing calendar starting at offset months from now
router.get('/calendar', isLoggedIn, wrapAsync(async (req, res) => {
  const { listingId } = req.query;
  const offset = parseInt(req.query.offset || '0', 10);
  if (!listingId) return res.status(400).json({ error: 'listingId required' });

  const listing = await Listing.findById(listingId).lean();
  if (!listing) return res.status(404).json({ error: 'Listing not found' });

  const bookings = await Booking.find({ listing: listing._id }).lean();
  const bookedSet = new Set();
  bookings.forEach(b => {
    const start = new Date(b.checkIn);
    const end = new Date(b.checkOut);
    for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
      bookedSet.add(d.toISOString().slice(0,10));
    }
  });

  const now = new Date();
  const monthsToShow = 3;
  const months = [];
  for (let i = 0; i < monthsToShow; i++) {
    const m = new Date(now.getFullYear(), now.getMonth() + offset + i, 1);
    const grid = buildMonthGridForJson(m.getFullYear(), m.getMonth(), bookedSet);
    months.push({ year: m.getFullYear(), month: m.getMonth(), grid });
  }

  res.json({ listingId, months, bookingsByDate });
}));

module.exports = router;
