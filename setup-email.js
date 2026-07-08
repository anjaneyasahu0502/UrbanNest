#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEmail() {
  console.log('\n📧 Email Configuration Setup for UrbanNest\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  console.log('Choose your email service:\n');
  console.log('1. Gmail (Recommended for testing)');
  console.log('2. Outlook/Hotmail');
  console.log('3. SendGrid (Recommended for production)');
  console.log('4. Custom SMTP');
  console.log('5. Skip (Use console OTPs for now)\n');
  
  const choice = await question('Enter your choice (1-5): ');
  console.log('');
  
  if (choice === '5') {
    console.log('⏭️  Skipping email setup.');
    console.log('OTPs will be logged to console during signup.\n');
    rl.close();
    return;
  }
  
  let config = {};
  
  switch (choice) {
    case '1': // Gmail
      console.log('📧 Gmail Setup\n');
      console.log('Before continuing:');
      console.log('1. Enable 2-Factor Authentication on your Google Account');
      console.log('2. Generate an App Password:');
      console.log('   • Go to: https://myaccount.google.com/apppasswords');
      console.log('   • Select app: Mail');
      console.log('   • Select device: Other (Custom name)');
      console.log('   • Copy the 16-character password\n');
      
      const gmailReady = await question('Have you generated an App Password? (y/n): ');
      if (gmailReady.toLowerCase() !== 'y') {
        console.log('\n⏸️  Please generate an App Password first.');
        console.log('See EMAIL_SETUP_GUIDE.md for detailed instructions.\n');
        rl.close();
        return;
      }
      
      config.EMAIL_HOST = 'smtp.gmail.com';
      config.EMAIL_PORT = '587';
      config.EMAIL_USER = await question('\nEnter your Gmail address: ');
      config.EMAIL_PASSWORD = await question('Enter your App Password (16 chars): ');
      break;
      
    case '2': // Outlook
      console.log('📧 Outlook/Hotmail Setup\n');
      config.EMAIL_HOST = 'smtp-mail.outlook.com';
      config.EMAIL_PORT = '587';
      config.EMAIL_USER = await question('Enter your Outlook email: ');
      config.EMAIL_PASSWORD = await question('Enter your password or App Password: ');
      break;
      
    case '3': // SendGrid
      console.log('📧 SendGrid Setup\n');
      console.log('Before continuing:');
      console.log('1. Sign up at https://sendgrid.com/');
      console.log('2. Create an API Key (Settings → API Keys)');
      console.log('3. Verify a sender email\n');
      
      const sgReady = await question('Have you created an API Key? (y/n): ');
      if (sgReady.toLowerCase() !== 'y') {
        console.log('\n⏸️  Please create a SendGrid API Key first.\n');
        rl.close();
        return;
      }
      
      config.EMAIL_HOST = 'smtp.sendgrid.net';
      config.EMAIL_PORT = '587';
      config.EMAIL_USER = 'apikey';
      config.EMAIL_PASSWORD = await question('\nEnter your SendGrid API Key: ');
      break;
      
    case '4': // Custom
      console.log('📧 Custom SMTP Setup\n');
      config.EMAIL_HOST = await question('SMTP Host: ');
      config.EMAIL_PORT = await question('SMTP Port (usually 587): ');
      config.EMAIL_USER = await question('SMTP Username/Email: ');
      config.EMAIL_PASSWORD = await question('SMTP Password: ');
      break;
      
    default:
      console.log('❌ Invalid choice\n');
      rl.close();
      return;
  }
  
  console.log('\n💾 Saving configuration to .env...\n');
  
  // Read existing .env
  const envPath = path.join(__dirname, '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf-8');
  }
  
  // Remove existing email config
  envContent = envContent.replace(/EMAIL_HOST=.*/g, '');
  envContent = envContent.replace(/EMAIL_PORT=.*/g, '');
  envContent = envContent.replace(/EMAIL_USER=.*/g, '');
  envContent = envContent.replace(/EMAIL_PASSWORD=.*/g, '');
  
  // Add new config
  envContent += '\n# Email Configuration for OTP\n';
  envContent += `EMAIL_HOST=${config.EMAIL_HOST}\n`;
  envContent += `EMAIL_PORT=${config.EMAIL_PORT}\n`;
  envContent += `EMAIL_USER=${config.EMAIL_USER}\n`;
  envContent += `EMAIL_PASSWORD=${config.EMAIL_PASSWORD}\n`;
  
  // Write back
  fs.writeFileSync(envPath, envContent.trim() + '\n');
  
  console.log('✅ Configuration saved!\n');
  console.log('Testing email configuration...\n');
  
  rl.close();
  
  // Test email
  require('dotenv').config();
  const { sendEmailOTP } = require('./utils/otpService');
  
  const testOTP = '123456';
  console.log(`📤 Sending test email to ${config.EMAIL_USER}...\n`);
  
  try {
    const result = await sendEmailOTP(config.EMAIL_USER, testOTP);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!\n');
      console.log('📬 Check your inbox for the test OTP email.\n');
      console.log('Next steps:');
      console.log('1. Verify you received the email');
      console.log('2. Restart your server: npm start');
      console.log('3. Try registering a new user\n');
    } else {
      console.log('⚠️  Email sent with warnings:', result.message);
      console.log('\nCheck server logs for details.\n');
    }
  } catch (error) {
    console.log('❌ Test email failed:', error.message);
    console.log('\nTroubleshooting:');
    console.log('• Verify your credentials are correct');
    console.log('• For Gmail, make sure you used App Password');
    console.log('• Check EMAIL_SETUP_GUIDE.md for help\n');
  }
}

setupEmail().catch(error => {
  console.error('Error:', error);
  rl.close();
  process.exit(1);
});
