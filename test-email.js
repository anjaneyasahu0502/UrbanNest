#!/usr/bin/env node

require('dotenv').config();
const { sendEmailOTP } = require('./utils/otpService');

async function testEmail() {
  console.log('\n🧪 Testing Email Configuration\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Check configuration
  console.log('Configuration:');
  console.log('  EMAIL_HOST:', process.env.EMAIL_HOST || '❌ Not set');
  console.log('  EMAIL_PORT:', process.env.EMAIL_PORT || '❌ Not set');
  console.log('  EMAIL_USER:', process.env.EMAIL_USER || '❌ Not set');
  console.log('  EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set (hidden)' : '❌ Not set');
  console.log('');
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ Email service is NOT configured!\n');
    console.log('To configure email:');
    console.log('1. Read EMAIL_SETUP_GUIDE.md');
    console.log('2. Add EMAIL_USER and EMAIL_PASSWORD to .env');
    console.log('3. Run this test again\n');
    console.log('For now, OTPs will be logged to console during signup.\n');
    process.exit(1);
  }
  
  // Get test email
  const testEmail = process.argv[2] || process.env.EMAIL_USER;
  console.log(`📧 Sending test OTP to: ${testEmail}\n`);
  
  // Generate test OTP
  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`🔐 Test OTP: ${testOTP}\n`);
  
  // Send email
  console.log('📤 Sending email...\n');
  try {
    const result = await sendEmailOTP(testEmail, testOTP);
    
    if (result.success) {
      console.log('✅ Email sent successfully!\n');
      console.log('Result:', result.message);
      console.log('\n📬 Check your inbox for the OTP email.');
      console.log('   Subject: Email Verification Code - UrbanNest');
      console.log(`   OTP: ${testOTP}\n`);
      console.log('If you don\'t see it:');
      console.log('  • Check spam/junk folder');
      console.log('  • Wait a few minutes');
      console.log('  • Verify email address is correct\n');
    } else {
      console.log('⚠️  Email sent with warnings\n');
      console.log('Result:', result.message);
      console.log('\nCheck server logs for details.\n');
    }
  } catch (error) {
    console.log('❌ Email sending failed!\n');
    console.error('Error:', error.message);
    console.log('\nTroubleshooting:');
    console.log('  • Verify EMAIL_USER and EMAIL_PASSWORD in .env');
    console.log('  • For Gmail, use App Password (not regular password)');
    console.log('  • Check EMAIL_SETUP_GUIDE.md for detailed instructions\n');
    process.exit(1);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

// Show usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\nUsage: node test-email.js [email]\n');
  console.log('Examples:');
  console.log('  node test-email.js                    # Send to EMAIL_USER');
  console.log('  node test-email.js user@example.com   # Send to specific email\n');
  process.exit(0);
}

testEmail().catch(error => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});
