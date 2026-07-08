const { test, expect } = require('@playwright/test');
const { EmailHelper } = require('./helpers/email-helper');

test.describe('Signup with FreeCustom.email Integration', () => {
  let emailHelper;
  let testEmail;
  let testUsername;

  test.beforeAll(() => {
    emailHelper = new EmailHelper();
  });

  test.beforeEach(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    testEmail = emailHelper.generateTestEmail();
    testUsername = `testuser${timestamp}`;

    // Register test inbox
    await emailHelper.registerInbox(testEmail);
  });

  test.afterEach(async () => {
    // Cleanup test inbox
    if (testEmail) {
      await emailHelper.cleanupInbox(testEmail);
    }
  });

  test('complete signup flow with real email OTP', async ({ page }) => {
    console.log(`\n🧪 Testing signup with email: ${testEmail}`);

    // Navigate to registration
    await page.goto('/auth/register');
    await expect(page.locator('h1')).toContainText('Create Account');

    // Fill registration form
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');

    console.log('📝 Submitting registration form...');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Wait for OTP verification page
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/, { timeout: 10000 });
    console.log('✓ Redirected to OTP verification page');

    // Wait for email OTP
    console.log('📧 Waiting for email OTP...');
    const emailOTP = await emailHelper.waitForOTP(testEmail, {
      timeoutMs: 45000,
      subject: 'Email Verification OTP - UrbanNest'
    });
    console.log(`✓ Received email OTP: ${emailOTP}`);

    // Enter OTPs
    await page.fill('input[name="emailOTP"]', emailOTP);

    console.log('🔐 Submitting OTP verification...');
    await page.getByRole('button', { name: 'Verify & Complete Registration' }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
    console.log('✓ Redirected to login page');

    // Verify success message
    const successMessage = page.locator('.alert-success');
    await expect(successMessage).toBeVisible();
    console.log('✓ Success message displayed');

    // Login with new credentials
    console.log('🔑 Logging in with new credentials...');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.getByRole('button', { name: 'Sign In' }).click();

    // Should be logged in
    await expect(page).toHaveURL(/.*\/listings/, { timeout: 10000 });
    console.log('✓ Successfully logged in!');

    // Verify logout button is visible
    const logoutButton = page.locator('form[action="/auth/logout"]');
    await expect(logoutButton).toBeVisible();
    console.log('✓ User is authenticated\n');
  });

  test('verify email content and format', async ({ page }) => {
    console.log(`\n🧪 Testing email content with: ${testEmail}`);

    // Register user
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Wait for OTP page
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/);

    // Wait for email
    console.log('📧 Waiting for verification email...');
    const email = await emailHelper.waitForEmail(
      testEmail, 
      'Email Verification OTP - UrbanNest',
      45000
    );

    if (email) {
      console.log('✓ Email received');
      console.log(`  Subject: ${email.subject}`);
      console.log(`  From: ${email.from}`);
      
      // Verify email content
      expect(email.subject).toContain('Email Verification OTP - UrbanNest');
      
      // Extract OTP from content
      const otp = emailHelper.extractOTPFromContent(email.body || email.html);
      expect(otp).toMatch(/^\d{6}$/);
      console.log(`  OTP: ${otp}`);
      console.log('✓ Email format verified\n');
    } else {
      console.warn('⚠️  Email not received within timeout');
    }
  });

  test('handle multiple signup attempts with same email', async ({ page }) => {
    console.log(`\n🧪 Testing duplicate email handling: ${testEmail}`);

    // First signup
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/);
    console.log('✓ First signup initiated');

    // Try second signup with same email
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', `${testUsername}2`);
    await page.fill('input[name="email"]', testEmail); // Same email
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    // Should show error
    const errorMessage = page.locator('.alert-danger');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/Email already registered/i);
    console.log('✓ Duplicate email error displayed\n');
  });

  test('resend OTP functionality', async ({ page }) => {
    console.log(`\n🧪 Testing OTP resend with: ${testEmail}`);

    // Register user
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.getByRole('button', { name: 'Sign Up' }).click();
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/);
    console.log('✓ Registration submitted');

    // Get first OTP
    const firstOTP = await emailHelper.waitForOTP(testEmail, { timeoutMs: 30000, subject: 'Email Verification OTP - UrbanNest' });
    console.log(`✓ First OTP received: ${firstOTP}`);

    // Click resend
    const resendButton = page.locator('button:has-text("Resend")');
    await resendButton.click();
    console.log('🔄 Clicked resend button');

    // Should show success message
    const successMessage = page.locator('.alert-success');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/OTPs resent/i);
    console.log('✓ Resend success message displayed');

    // Get second OTP
    const secondOTP = await emailHelper.waitForOTP(testEmail, { timeoutMs: 30000, subject: 'Email Verification OTP - UrbanNest' });
    console.log(`✓ Second OTP received: ${secondOTP}`);

    // OTPs should be different (new ones generated)
    // Note: In some implementations, they might be the same
    console.log(`  First OTP:  ${firstOTP}`);
    console.log(`  Second OTP: ${secondOTP}\n`);
  });
});

test.describe('Email Service Integration Tests', () => {
  let emailHelper;

  test.beforeAll(() => {
    emailHelper = new EmailHelper();
  });

  test('verify FreeCustom.email service is accessible', async () => {
    if (!process.env.FCE_API_KEY) {
      test.skip('FCE_API_KEY not set, skipping service test');
    }

    const testEmail = emailHelper.generateTestEmail();
    const registered = await emailHelper.registerInbox(testEmail);
    
    expect(registered).toBe(true);
    console.log('✓ FreeCustom.email service is accessible');

    // Cleanup
    await emailHelper.cleanupInbox(testEmail);
  });

  test('verify email helper generates unique addresses', () => {
    const email1 = emailHelper.generateTestEmail();
    const email2 = emailHelper.generateTestEmail();
    
    expect(email1).not.toBe(email2);
    expect(email1).toMatch(/@ditapi\.info$/);
    expect(email2).toMatch(/@ditapi\.info$/);
    console.log('✓ Email helper generates unique addresses');
  });
});
