const { test, expect } = require('@playwright/test');
const { FreecustomEmailClient } = require('freecustom-email');

// Initialize FreeCustom.email client
const fce = new FreecustomEmailClient({ 
  apiKey: process.env.FCE_API_KEY || '' 
});

test.describe('Signup with Email and Mobile OTP Verification', () => {
  let testInbox;
  let testMobile;
  let testUsername;

  test.beforeEach(async () => {
    // Generate unique test data
    const timestamp = Date.now();
    testInbox = `pw-test-${timestamp}@ditapi.info`;
    testMobile = `+1${Math.floor(2000000000 + Math.random() * 7999999999)}`;
    testUsername = `testuser${timestamp}`;

    // Register inbox with FreeCustom.email if API key is available
    if (process.env.FCE_API_KEY) {
      try {
        await fce.inboxes.register(testInbox, true);
        await fce.inboxes.startTest(testInbox, 'e2e-signup');
        console.log(`Registered test inbox: ${testInbox}`);
      } catch (error) {
        console.warn('FreeCustom.email registration failed:', error.message);
      }
    }
  });

  test('should complete full signup flow with email and mobile OTP', async ({ page }) => {
    // Step 1: Navigate to registration page
    await page.goto('/auth/register');
    await expect(page).toHaveURL(/.*\/auth\/register/);
    await expect(page.locator('h1')).toContainText('Create Account');

    // Step 2: Fill registration form
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testInbox);
    await page.fill('input[name="mobile"]', testMobile);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');

    // Step 3: Submit registration form
    await page.click('button[type="submit"]');

    // Step 4: Should redirect to OTP verification page
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/, { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Verify Your Account');

    // Step 5: Wait for and retrieve email OTP
    let emailOTP;
    if (process.env.FCE_API_KEY) {
      try {
        console.log('Waiting for email OTP...');
        emailOTP = await fce.otp.waitFor(testInbox, { 
          timeoutMs: 30000,
          subject: 'Email Verification OTP'
        });
        console.log(`Received email OTP: ${emailOTP}`);
      } catch (error) {
        console.warn('Failed to get OTP from FreeCustom.email:', error.message);
        // Fallback: check console logs or use test OTP
        emailOTP = '123456'; // Fallback for testing
      }
    } else {
      // If no API key, use console logs or manual input
      console.log('No FCE_API_KEY found. Check server console for OTPs.');
      emailOTP = '123456'; // Fallback
    }

    // For mobile OTP, we'll need to check server console
    // In production, you'd integrate with Twilio or similar
    const mobileOTP = '654321'; // This should come from server console in dev mode

    // Step 6: Enter OTPs
    await page.fill('input[name="emailOTP"]', emailOTP);
    await page.fill('input[name="mobileOTP"]', mobileOTP);

    // Step 7: Submit OTP verification
    await page.click('button[type="submit"]');

    // Step 8: Should redirect to login page with success message
    await expect(page).toHaveURL(/.*\/auth\/login/, { timeout: 10000 });
    
    // Check for success message
    const successMessage = page.locator('.alert-success');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/Registration successful|Please log in/i);

    // Step 9: Login with new credentials
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.click('button[type="submit"]');

    // Step 10: Should be logged in and redirected to listings
    await expect(page).toHaveURL(/.*\/listings/, { timeout: 10000 });
    
    // Verify user is logged in (check for logout button or user menu)
    const logoutButton = page.locator('form[action="/auth/logout"]');
    await expect(logoutButton).toBeVisible();
  });

  test('should show error for duplicate email', async ({ page }) => {
    // First, create a user
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testInbox);
    await page.fill('input[name="mobile"]', testMobile);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.click('button[type="submit"]');

    // Wait for redirect to OTP page
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/);

    // Go back and try to register with same email
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', `${testUsername}2`);
    await page.fill('input[name="email"]', testInbox); // Same email
    await page.fill('input[name="mobile"]', `+1${Math.floor(2000000000 + Math.random() * 7999999999)}`);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('.alert-danger');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/Email already registered/i);
  });

  test('should show error for password mismatch', async ({ page }) => {
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testInbox);
    await page.fill('input[name="mobile"]', testMobile);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass123');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('.alert-danger');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/Passwords do not match/i);
  });

  test('should show error for invalid OTP', async ({ page }) => {
    // Register user
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testInbox);
    await page.fill('input[name="mobile"]', testMobile);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.click('button[type="submit"]');

    // Wait for OTP page
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/);

    // Enter wrong OTPs
    await page.fill('input[name="emailOTP"]', '000000');
    await page.fill('input[name="mobileOTP"]', '000000');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('.alert-danger');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/Invalid.*OTP/i);
  });

  test('should allow resending OTP', async ({ page }) => {
    // Register user
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testInbox);
    await page.fill('input[name="mobile"]', testMobile);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.click('button[type="submit"]');

    // Wait for OTP page
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/);

    // Click resend button
    const resendButton = page.locator('button:has-text("Resend")');
    await resendButton.click();

    // Should show success message
    const successMessage = page.locator('.alert-success');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/OTPs resent/i);
  });

  test('should navigate between login and signup pages', async ({ page }) => {
    // Start at login page
    await page.goto('/auth/login');
    await expect(page.locator('h1')).toContainText('Sign In');

    // Click Sign Up link
    await page.click('a:has-text("Sign Up")');
    await expect(page).toHaveURL(/.*\/auth\/register/);
    await expect(page.locator('h1')).toContainText('Create Account');

    // Click Sign In link
    await page.click('a:has-text("Sign In")');
    await expect(page).toHaveURL(/.*\/auth\/login/);
    await expect(page.locator('h1')).toContainText('Sign In');
  });

  test('should prevent login before verification', async ({ page }) => {
    // Register user but don't verify
    await page.goto('/auth/register');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="email"]', testInbox);
    await page.fill('input[name="mobile"]', testMobile);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.fill('input[name="confirmPassword"]', 'Str0ng!Pass#99');
    await page.click('button[type="submit"]');

    // Wait for OTP page
    await expect(page).toHaveURL(/.*\/auth\/verify-otp/);

    // Try to login without verifying
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', testUsername);
    await page.fill('input[name="password"]', 'Str0ng!Pass#99');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('.alert-danger');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/verify.*email.*mobile/i);
  });
});

test.describe('Login Flow', () => {
  test('should login with existing verified user', async ({ page }) => {
    // Use the admin user that should be pre-created
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');

    // Should be logged in
    await expect(page).toHaveURL(/.*\/listings/, { timeout: 10000 });
    
    // Verify user is logged in
    const logoutButton = page.locator('form[action="/auth/logout"]');
    await expect(logoutButton).toBeVisible();
  });

  test('should show error for wrong password', async ({ page }) => {
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.locator('.alert-danger');
    await expect(errorMessage).toBeVisible();
    await expect(errorMessage).toContainText(/Incorrect/i);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/auth/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/.*\/listings/);

    // Logout
    const logoutButton = page.locator('form[action="/auth/logout"] button');
    await logoutButton.click();

    // Should redirect to listings with success message
    await expect(page).toHaveURL(/.*\/listings/);
    const successMessage = page.locator('.alert-success');
    await expect(successMessage).toBeVisible();
    await expect(successMessage).toContainText(/Logged out/i);
  });
});
