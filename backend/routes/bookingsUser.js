const express = require('express');
const router = express.Router();
const Booking = require('../models/booking');
const Listing = require('../models/listing');
const wrapAsync = require('../utils/wrapAsync');
const { isLoggedIn } = require('../middleware');

router.get('/', isLoggedIn, wrapAsync(async (req, res) => {
  const userId = req.user._id;
  const ownedListings = await Listing.find({ author: userId }).select('_id');
  const ownedIds = ownedListings.map(l => l._id);

  const bookings = await Booking.find({ $or: [{ user: userId }, { listing: { $in: ownedIds } }] })
    .populate('listing')
    .sort({ createdAt: -1 });

  res.render('bookings/index', { bookings });
}));

router.delete('/:id', isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate('listing');
  if (!booking) {
    req.flash('error', 'Booking not found');
    return res.redirect('/bookings');
  }

  const userId = String(req.user._id);
  const isOwner = String(booking.user) === userId;
  const isHost = booking.listing && booking.listing.author && String(booking.listing.author) === userId;
  if (!isOwner && !isHost) {
    req.flash('error', 'You do not have permission to cancel this booking');
    return res.redirect('/bookings');
  }

  await Booking.findByIdAndDelete(id);
  req.flash('success', 'Booking cancelled');
  res.redirect('/bookings');
}));

router.get('/:id', isLoggedIn, wrapAsync(async (req, res) => {
  const { id } = req.params;
  const booking = await Booking.findById(id).populate('listing').populate('user');
  if (!booking) {
    req.flash('error', 'Booking not found');
    return res.redirect('/bookings');
  }

  const isOwner = String(booking.user._id) === String(req.user._id);
  const isHost = booking.listing && booking.listing.author && String(booking.listing.author) === String(req.user._id);

  res.render('bookings/show', { booking, isOwner, isHost });
}));

router.post('/:id/refund', isLoggedIn, wrapAsync(async (req, res) => {
  const stripeSecret = process.env.STRIPE_SECRET;
  if (!stripeSecret) {
    req.flash('error', 'Stripe not configured');
    return res.redirect('back');
  }

  const { id } = req.params;
  const booking = await Booking.findById(id).populate('listing').populate('user');
  if (!booking) {
    req.flash('error', 'Booking not found');
    return res.redirect('/bookings');
  }

  const isHost = booking.listing && booking.listing.author && String(booking.listing.author) === String(req.user._id);
  if (!isHost) {
    req.flash('error', 'Only the host can issue refunds');
    return res.redirect('/bookings');
  }

  if (!booking.paid || !booking.stripeSessionId) {
    req.flash('error', 'Booking has no associated payment');
    return res.redirect(`/bookings/${id}`);
  }

  const Stripe = require('stripe');
  const stripe = Stripe(stripeSecret);
  // retrieve session to get payment_intent
  const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId);
  const paymentIntent = session.payment_intent;
  if (!paymentIntent) {
    req.flash('error', 'Payment intent not found');
    return res.redirect(`/bookings/${id}`);
  }

  const refund = await stripe.refunds.create({ payment_intent: paymentIntent });
  booking.refundId = refund.id;
  booking.status = 'refunded';
  booking.paid = false;
  await booking.save();

  req.flash('success', 'Refund issued');
  res.redirect(`/bookings/${id}`);
}));

module.exports = router;

