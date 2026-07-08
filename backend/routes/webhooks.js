const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const Booking = require('../models/booking');

// POST /webhooks/stripe
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeSecret = process.env.STRIPE_SECRET;
  if (!stripeSecret) return res.status(400).send('Stripe not configured');
  const stripe = Stripe(stripeSecret);

  let event;
  try {
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // if no endpoint secret, parse body directly (less secure)
      event = req.body;
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    try {
      // try find existing booking by stripeSessionId
      let booking = await Booking.findOne({ stripeSessionId: session.id });
      if (booking) {
        booking.paid = true;
        booking.status = 'confirmed';
        await booking.save();
      } else if (session.metadata && session.metadata.listing) {
        // If no provisional booking exists, create one using metadata. Note: userId may be present in metadata.
        const bookingData = {
          listing: session.metadata.listing,
          user: session.metadata.userId || null,
          checkIn: session.metadata.checkIn,
          checkOut: session.metadata.checkOut,
          totalPrice: Number(session.metadata.total) || 0,
          paid: true,
          stripeSessionId: session.id,
          status: 'confirmed'
        };
        await Booking.create(bookingData);
      }
    } catch (e) {
      console.error('Error handling checkout.session.completed:', e);
    }
  }

  res.json({ received: true });
});

module.exports = router;
