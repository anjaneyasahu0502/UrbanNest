#!/usr/bin/env node

/**
 * Test OTP Generation with Non-Repeating Digits
 * 
 * This script tests the OTP generation algorithm to ensure:
 * 1. OTPs are always 6 digits
 * 2. All digits are unique (non-repeating)
 * 3. Random distribution is good
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/user');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

async function testOTPGeneration() {
  console.log('\n🧪 Testing OTP Generation with Non-Repeating Digits\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  await mongoose.connect(MONGO_URL);
  
  // Create a temporary user for testing
  const testUser = new User({
    username: 'test_otp_user',
    email: 'test@example.com',
    password: 'test123',
    emailVerified: false
  });
  
  console.log('Generating 20 sample OTPs:\n');
  
  const otps = [];
  const digitCounts = {};
  
  for (let i = 0; i < 20; i++) {
    const otp = testUser.generateOTP();
    otps.push(otp);
    
    // Check for unique digits
    const digits = otp.split('');
    const uniqueDigits = new Set(digits);
    const hasUniqueDigits = uniqueDigits.size === 6;
    
    // Count digit occurrences
    digits.forEach(d => {
      digitCounts[d] = (digitCounts[d] || 0) + 1;
    });
    
    const status = hasUniqueDigits ? '✓' : '✗';
    console.log(`${i + 1}. ${otp}  ${status}  ${hasUniqueDigits ? 'All unique' : 'HAS REPEATS!'}`);
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Validation
  console.log('Validation Results:\n');
  
  let allValid = true;
  
  // Check 1: All OTPs are 6 digits
  const allSixDigits = otps.every(otp => otp.length === 6);
  console.log(`✓ All OTPs are 6 digits: ${allSixDigits ? 'PASS' : 'FAIL'}`);
  if (!allSixDigits) allValid = false;
  
  // Check 2: All OTPs have unique digits
  const allUnique = otps.every(otp => {
    const digits = otp.split('');
    const uniqueDigits = new Set(digits);
    return uniqueDigits.size === 6;
  });
  console.log(`✓ All OTPs have unique digits: ${allUnique ? 'PASS' : 'FAIL'}`);
  if (!allUnique) allValid = false;
  
  // Check 3: All OTPs are numeric
  const allNumeric = otps.every(otp => /^\d{6}$/.test(otp));
  console.log(`✓ All OTPs are numeric: ${allNumeric ? 'PASS' : 'FAIL'}`);
  if (!allNumeric) allValid = false;
  
  // Check 4: OTPs are different (randomness)
  const uniqueOTPs = new Set(otps);
  const allDifferent = uniqueOTPs.size === otps.length;
  console.log(`✓ All OTPs are different: ${allDifferent ? 'PASS' : 'FAIL'}`);
  if (!allDifferent) allValid = false;
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Distribution analysis
  console.log('Digit Distribution (should be roughly equal):\n');
  const sortedDigits = Object.keys(digitCounts).sort();
  sortedDigits.forEach(digit => {
    const count = digitCounts[digit];
    const percentage = ((count / 120) * 100).toFixed(1); // 20 OTPs * 6 digits = 120 total
    const bar = '█'.repeat(Math.round(count / 2));
    console.log(`  ${digit}: ${bar} ${count} (${percentage}%)`);
  });
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Example OTPs
  console.log('Example OTPs for Testing:\n');
  console.log(`  Email OTP: ${otps[0]}`);
  console.log(`  Email OTP: ${otps[1]}`);
  console.log(`  Email OTP: ${otps[2]}`);
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (allValid) {
    console.log('✅ All tests PASSED! OTP generation is working correctly.\n');
  } else {
    console.log('❌ Some tests FAILED! Check the implementation.\n');
  }
  
  await mongoose.disconnect();
}

testOTPGeneration().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
