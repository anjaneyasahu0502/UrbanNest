const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  emailVerified: { type: Boolean, default: false },
  emailOTP: { type: String },
  otpExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

userSchema.statics.register = async function(username, email, password) {
  const hash = await bcrypt.hash(password, 12);
  const user = new this({ 
    username, 
    email, 
    password: hash,
    emailVerified: false
  });
  await user.save();
  return user;
};

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password);
};

/**
 * Generate a 6-digit OTP with non-repeating digits
 * Example: 123456, 987654, 102345 (all digits are unique)
 */
userSchema.methods.generateOTP = function() {
  const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  // Shuffle array using Fisher-Yates algorithm
  for (let i = digits.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [digits[i], digits[j]] = [digits[j], digits[i]];
  }
  
  // Take first 6 digits and join them
  return digits.slice(0, 6).join('');
};

userSchema.methods.setOTP = async function(emailOTP) {
  this.emailOTP = emailOTP;
  this.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  await this.save();
};

userSchema.methods.verifyOTP = function(emailOTP) {
  if (this.otpExpiry < new Date()) {
    return { success: false, message: 'OTP expired' };
  }
  if (this.emailOTP !== emailOTP) {
    return { success: false, message: 'Invalid OTP' };
  }
  return { success: true };
};

userSchema.methods.markVerified = async function() {
  this.emailVerified = true;
  this.emailOTP = undefined;
  this.otpExpiry = undefined;
  await this.save();
};

module.exports = mongoose.model('User', userSchema);
