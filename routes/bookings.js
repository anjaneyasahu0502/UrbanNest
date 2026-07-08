const express = require('express');
const router = express.Router({ mergeParams: true });
const Listing = require('../models/listing');
const Booking = require('../models/booking');
const wrapAsync = require('../utils/wrapAsync');
const ExpressError = require('../utils/ExpressError');
const { isLoggedIn, loadListing } = require('../middleware');

// helper to check date overlap
function datesOverlap(startA, endA, startB, endB) {
  return (startA < endB) && (startB < endA);
}

router.use(loadListing);

router.post('/', isLoggedIn, wrapAsync(async (req, res) => {
  const listing = res.locals.listing;
  const { checkIn, checkOut } = req.body;
  if (!checkIn || !checkOut) {
    req.flash('error', 'Please provide check-in and check-out dates');
    return res.redirect(`/listings/${listing._id}`);
  }

  const start = new Date(checkIn);
  const end = new Date(checkOut);
  if (isNaN(start) || isNaN(end) || start >= end) {
    req.flash('error', 'Invalid date range');
    return res.redirect(`/listings/${listing._id}`);
  }

  // check existing bookings for overlap
  const existing = await Booking.find({ listing: listing._id });
  for (let b of existing) {
    if (datesOverlap(start, end, b.checkIn, b.checkOut)) {
      req.flash('error', 'Selected dates overlap with an existing booking');
      return res.redirect(`/listings/${listing._id}`);
    }
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const nights = Math.ceil((end - start) / msPerDay);
  const baseTotal = (listing.price || 0) * nights;

  // Calculate GST based on price per night
  // - Tariff below ₹1,000: Exempt (0% GST)
  // - Tariff ₹1,001 to ₹7,500: 5% GST
  // - Tariff above ₹7,500: 18% GST
  let gstRate = 0;
  if (listing.price > 7500) {
    gstRate = 0.18;
  } else if (listing.price >= 1001) {
    gstRate = 0.05;
  }

  const gstAmount = baseTotal * gstRate;
  const total = baseTotal + gstAmount;

  // Stripe flow if configured
  const stripeSecret = process.env.STRIPE_SECRET;
  if (stripeSecret) {
    const Stripe = require('stripe');
    const stripe = Stripe(stripeSecret);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'inr', product_data: { name: listing.title }, unit_amount: Math.round(total * 100) }, quantity: 1 }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/bookings/success?listing=${listing._id}&checkIn=${start.toISOString()}&checkOut=${end.toISOString()}&total=${total}`,
      cancel_url: `${req.protocol}://${req.get('host')}/listings/${listing._id}`
    });
    // attach metadata so webhooks can confirm bookings
    const metadata = { listing: String(listing._id), checkIn: start.toISOString(), checkOut: end.toISOString(), total: String(total), userId: String(req.user._id) };
    await stripe.checkout.sessions.update(session.id, { metadata });
    // create provisional booking linked to this session (paid=false). Webhook will mark as paid.
    const provisional = new Booking({ listing: listing._id, user: req.user._id, checkIn: start, checkOut: end, totalPrice: total, paid: false, stripeSessionId: session.id, status: 'pending' });
    await provisional.save();
    return res.redirect(session.url);
  }

  // create booking without payment
  const booking = new Booking({ 
    listing: listing._id, 
    user: req.user._id, 
    checkIn: start, 
    checkOut: end, 
    totalPrice: total, 
    paid: false 
  });
  await booking.save();
  req.flash('success', `Booking confirmed for ${nights} nights! Total: ₹${total.toLocaleString('en-IN')} (incl. ${gstRate * 100}% GST)`);
  res.redirect(`/listings/${listing._id}`);
}));

router.get('/success', isLoggedIn, wrapAsync(async (req, res) => {
  // called after Stripe success. Create booking here.
  const { session_id } = req.query;
  if (session_id) {
    // mark provisional booking paid if exists
    const booking = await Booking.findOne({ stripeSessionId: session_id });
    if (booking) {
      booking.paid = true;
      booking.status = 'confirmed';
      await booking.save();
      req.flash('success', 'Payment successful — booking confirmed');
      return res.redirect(`/listings/${booking.listing}`);
    }
  }
  // fallback
  req.flash('success', 'Payment successful');
  res.redirect('/listings');
}));

module.exports = router;
