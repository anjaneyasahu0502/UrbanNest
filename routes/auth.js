const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const { sendEmailOTP } = require('../utils/otpService');

router.get('/register', (req, res) => {
  res.render('auth/register');
});

router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    // Validation
    if (!username || !email || !password) {
      req.flash('error', 'All fields are required');
      return res.redirect('/auth/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match');
      return res.redirect('/auth/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/auth/register');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      if (existingUser.username === username) {
        req.flash('error', 'Username already exists');
      } else if (existingUser.email === email) {
        req.flash('error', 'Email already registered');
      }
      return res.redirect('/auth/register');
    }

    // Create user (unverified)
    const user = await User.register(username, email, password);

    // Generate OTP with non-repeating digits
    const emailOTP = user.generateOTP();
    await user.setOTP(emailOTP);

    // Send OTP
    await sendEmailOTP(email, emailOTP);

    // Store user ID in session for verification
    req.session.pendingUserId = user._id.toString();

    req.flash('success', 'OTP sent to your email. Please verify to complete registration.');
    res.redirect('/auth/verify-otp');
  } catch (err) {
    console.error('Registration error:', err);
    req.flash('error', err.message || 'Registration failed');
    res.redirect('/auth/register');
  }
});

router.get('/verify-otp', (req, res) => {
  if (!req.session.pendingUserId) {
    req.flash('error', 'No pending registration found');
    return res.redirect('/auth/register');
  }
  res.render('auth/verify-otp');
});

router.post('/verify-otp', async (req, res) => {
  try {
    const { emailOTP } = req.body;
    const userId = req.session.pendingUserId;

    if (!userId) {
      req.flash('error', 'No pending registration found');
      return res.redirect('/auth/register');
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/auth/register');
    }

    // Verify OTP
    const result = user.verifyOTP(emailOTP);
    if (!result.success) {
      req.flash('error', result.message);
      return res.redirect('/auth/verify-otp');
    }

    // Mark user as verified
    await user.markVerified();

    // Clear pending registration
    delete req.session.pendingUserId;

    req.flash('success', 'Registration successful! Please log in.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('OTP verification error:', err);
    req.flash('error', 'Verification failed. Please try again.');
    res.redirect('/auth/verify-otp');
  }
});

router.post('/resend-otp', async (req, res) => {
  try {
    const userId = req.session.pendingUserId;

    if (!userId) {
      req.flash('error', 'No pending registration found');
      return res.redirect('/auth/register');
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/auth/register');
    }

    // Generate new OTP with non-repeating digits
    const emailOTP = user.generateOTP();
    await user.setOTP(emailOTP);

    // Resend OTP
    await sendEmailOTP(user.email, emailOTP);

    req.flash('success', 'OTP resent successfully');
    res.redirect('/auth/verify-otp');
  } catch (err) {
    console.error('Resend OTP error:', err);
    req.flash('error', 'Failed to resend OTP');
    res.redirect('/auth/verify-otp');
  }
});

router.get('/login', (req, res) => {
  res.render('auth/login');
});

// ─── Forgot Password ───────────────────────────────────────────────────────

router.get('/forgot-password', (req, res) => {
  res.render('auth/forgot-password');
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      req.flash('error', 'Email is required');
      return res.redirect('/auth/forgot-password');
    }

    const user = await User.findOne({ email });

    // Always show the same message to prevent email enumeration
    if (!user) {
      req.flash('success', 'If that email is registered, a reset code has been sent.');
      return res.redirect('/auth/forgot-password');
    }

    if (!user.emailVerified) {
      req.flash('error', 'This account has not been verified yet. Please complete registration first.');
      return res.redirect('/auth/forgot-password');
    }

    // Generate OTP and store user id in session
    const otp = user.generateOTP();
    await user.setOTP(otp);
    await sendEmailOTP(email, otp);

    req.session.resetUserId = user._id.toString();

    req.flash('success', 'A 6-digit reset code has been sent to your email.');
    res.redirect('/auth/reset-verify-otp');
  } catch (err) {
    console.error('Forgot password error:', err);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/auth/forgot-password');
  }
});

// Step 2 – verify OTP sent to email
router.get('/reset-verify-otp', (req, res) => {
  if (!req.session.resetUserId) {
    req.flash('error', 'Session expired. Please start again.');
    return res.redirect('/auth/forgot-password');
  }
  res.render('auth/reset-verify-otp');
});

router.post('/reset-verify-otp', async (req, res) => {
  try {
    const { emailOTP } = req.body;
    const userId = req.session.resetUserId;

    if (!userId) {
      req.flash('error', 'Session expired. Please start again.');
      return res.redirect('/auth/forgot-password');
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/auth/forgot-password');
    }

    const result = user.verifyOTP(emailOTP);
    if (!result.success) {
      req.flash('error', result.message === 'OTP expired' ? 'Code expired. Please request a new one.' : 'Invalid code. Please try again.');
      return res.redirect('/auth/reset-verify-otp');
    }

    // OTP valid – clear it and allow password reset
    user.emailOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Mark session as OTP-verified so reset page is accessible
    req.session.resetVerified = true;

    res.redirect('/auth/reset-password');
  } catch (err) {
    console.error('Reset OTP verify error:', err);
    req.flash('error', 'Verification failed. Please try again.');
    res.redirect('/auth/reset-verify-otp');
  }
});

router.post('/reset-resend-otp', async (req, res) => {
  try {
    const userId = req.session.resetUserId;
    if (!userId) {
      req.flash('error', 'Session expired. Please start again.');
      return res.redirect('/auth/forgot-password');
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/auth/forgot-password');
    }

    const otp = user.generateOTP();
    await user.setOTP(otp);
    await sendEmailOTP(user.email, otp);

    req.flash('success', 'A new reset code has been sent to your email.');
    res.redirect('/auth/reset-verify-otp');
  } catch (err) {
    console.error('Reset resend OTP error:', err);
    req.flash('error', 'Failed to resend code. Please try again.');
    res.redirect('/auth/reset-verify-otp');
  }
});

// Step 3 – set new password
router.get('/reset-password', (req, res) => {
  if (!req.session.resetUserId || !req.session.resetVerified) {
    req.flash('error', 'Session expired. Please start again.');
    return res.redirect('/auth/forgot-password');
  }
  res.render('auth/reset-password');
});

router.post('/reset-password', async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const userId = req.session.resetUserId;

    if (!userId || !req.session.resetVerified) {
      req.flash('error', 'Session expired. Please start again.');
      return res.redirect('/auth/forgot-password');
    }

    if (!password || !confirmPassword) {
      req.flash('error', 'Both fields are required.');
      return res.redirect('/auth/reset-password');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/auth/reset-password');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters.');
      return res.redirect('/auth/reset-password');
    }

    const user = await User.findById(userId);
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/auth/forgot-password');
    }

    const bcrypt = require('bcrypt');
    user.password = await bcrypt.hash(password, 12);
    await user.save();

    // Clean up session
    delete req.session.resetUserId;
    delete req.session.resetVerified;

    req.flash('success', 'Password changed successfully! Please sign in with your new password.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error('Reset password error:', err);
    req.flash('error', 'Failed to reset password. Please try again.');
    res.redirect('/auth/reset-password');
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username } = req.body;
    
    // Check if user is verified
    const user = await User.findOne({ username });
    if (user && !user.emailVerified) {
      req.flash('error', 'Please verify your email address first');
      return res.redirect('/auth/login');
    }

    passport.authenticate('local', {
      failureRedirect: '/auth/login',
      failureFlash: true
    })(req, res, () => {
      req.flash('success', 'Welcome back!');
      res.redirect('/listings');
    });
  } catch (err) {
    next(err);
  }
});

// ─── Admin Login ───────────────────────────────────────────────────────────

router.get('/admin/login', (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.role === 'admin') {
    return res.redirect('/listings');
  }
  res.render('auth/admin-login');
});

router.post('/admin/login', async (req, res, next) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      req.flash('error', 'Invalid admin credentials');
      return res.redirect('/auth/admin/login');
    }

    if (user.role !== 'admin') {
      req.flash('error', 'Access denied. Admin credentials required.');
      return res.redirect('/auth/admin/login');
    }

    passport.authenticate('local', {
      failureRedirect: '/auth/admin/login',
      failureFlash: true
    })(req, res, () => {
      req.flash('success', `Welcome, Admin ${req.user.username}! 🛡️`);
      res.redirect('/listings');
    });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res, next) => {
  req.logout(err => {
    if (err) return next(err);
    req.flash('success', 'Logged out successfully');
    res.redirect('/listings');
  });
});

module.exports = router;