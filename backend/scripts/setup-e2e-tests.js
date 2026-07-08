#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up E2E Testing Environment\n');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.log('⚠️  .env file not found. Creating from .env.example...');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✓ Created .env file\n');
  } else {
    console.error('❌ .env.example not found!');
    process.exit(1);
  }
}

// Check for FCE_API_KEY
const envContent = fs.readFileSync(envPath, 'utf-8');
if (!envContent.includes('FCE_API_KEY=') || envContent.match(/FCE_API_KEY=\s*$/m)) {
  console.log('⚠️  FCE_API_KEY not set in .env');
  console.log('   Tests will use fallback OTPs from console logs');
  console.log('   To use real email testing:');
  console.log('   1. Sign up at https://freecustom.email/');
  console.log('   2. Get your API key');
  console.log('   3. Add to .env: FCE_API_KEY=your_key_here\n');
}

// Install Playwright browsers
console.log('📦 Installing Playwright browsers...');
try {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✓ Playwright browsers installed\n');
} catch (error) {
  console.error('❌ Failed to install Playwright browsers');
  process.exit(1);
}

// Create admin user
console.log('👤 Creating admin user...');
try {
  execSync('node scripts/createAdmin.js', { stdio: 'inherit' });
  console.log('✓ Admin user ready\n');
} catch (error) {
  console.warn('⚠️  Admin user creation failed (may already exist)\n');
}

// Check MongoDB connection
console.log('🔍 Checking MongoDB connection...');
const mongoose = require('mongoose');
const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';

mongoose.connect(MONGO_URL)
  .then(() => {
    console.log('✓ MongoDB connected\n');
    mongoose.disconnect();
    
    console.log('✅ E2E Testing Environment Ready!\n');
    console.log('Run tests with:');
    console.log('  npm run test:e2e          # Run all tests');
    console.log('  npm run test:e2e:ui       # Interactive UI mode');
    console.log('  npm run test:e2e:headed   # See browser in action\n');
    
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\nMake sure MongoDB is running:');
    console.log('  mongod --dbpath /path/to/data\n');
    process.exit(1);
  });
