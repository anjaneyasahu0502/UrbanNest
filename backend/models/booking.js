const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bookingSchema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date, required: true },
  totalPrice: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  stripeSessionId: { type: String },
  status: { type: String, default: 'confirmed' },
  refundId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
