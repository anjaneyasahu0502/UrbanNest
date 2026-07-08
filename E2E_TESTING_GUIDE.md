# E2E Testing Guide with FreeCustom.email

## Overview

This project uses Playwright for end-to-end testing with FreeCustom.email integration for real email verification testing.

## Setup

### 1. Install Dependencies

```bash
npm install
```

This will install:
- `@playwright/test` - E2E testing framework
- `freecustom-email` - Email testing service client

### 2. Install Playwright Browsers

```bash
npx playwright install chromium
```

Or install all browsers:
```bash
npx playwright install
```

### 3. Configure FreeCustom.email

1. Sign up at [FreeCustom.email](https://freecustom.email/)
2. Get your API key from the dashboard
3. Add to your `.env` file:

```env
FCE_API_KEY=your_api_key_here
```

**Note**: Tests will still run without the API key, but will use fallback OTPs from console logs.

### 4. Prepare Test Environment

```bash
# Create admin user for testing
node scripts/createAdmin.js

# Optional: Seed test data
npm run seed
```

## Running Tests

### Run All E2E Tests

```bash
npm run test:e2e
```

### Run Tests in UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

This opens Playwright's interactive UI where you can:
- See tests running in real-time
- Debug failed tests
- Inspect DOM and network requests
- Time-travel through test execution

### Run Tests in Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Run Specific Test File

```bash
npx playwright test tests/e2e/signup.spec.js
```

### Run Specific Test

```bash
npx playwright test -g "complete signup flow"
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

## Test Structure

### Test Files

```
tests/e2e/
├── signup.spec.js              # Basic signup tests
├── signup-with-email.spec.js   # Tests with FreeCustom.email
└── helpers/
    └── email-helper.js         # Email testing utilities
```

### Test Scenarios

#### 1. Complete Signup Flow (`signup-with-email.spec.js`)
- Register new user with real email
- Receive OTP via FreeCustom.email
- Verify OTP and complete registration
- Login with new credentials

#### 2. Email Content Verification
- Verify email subject and sender
- Extract and validate OTP format
- Check email HTML/text content

#### 3. Error Handling
- Duplicate email registration
- Password mismatch
- Invalid OTP
- Expired OTP

#### 4. Resend OTP
- Request new OTP
- Verify new OTP is sent
- Complete verification with new OTP

#### 5. Navigation
- Login to Signup navigation
- Signup to Login navigation

#### 6. Authentication
- Prevent login before verification
- Successful login after verification
- Logout functionality

## FreeCustom.email Integration

### EmailHelper Class

The `EmailHelper` class provides utilities for email testing:

```javascript
const { EmailHelper } = require('./helpers/email-helper');

const emailHelper = new EmailHelper();

// Generate unique test email
const email = emailHelper.generateTestEmail();
// Returns: pw-test-1234567890-123@ditapi.info

// Register test inbox
await emailHelper.registerInbox(email);

// Wait for OTP
const otp = await emailHelper.waitForOTP(email, {
  timeoutMs: 30000,
  subject: 'Email Verification OTP'
});

// Get all emails
const emails = await emailHelper.getEmails(email);

// Cleanup
await emailHelper.cleanupInbox(email);
```

### How It Works

1. **Test starts**: Generate unique email address
2. **Register inbox**: Create temporary inbox with FreeCustom.email
3. **Trigger action**: Submit signup form with test email
4. **Wait for email**: Poll FreeCustom.email API for incoming email
5. **Extract OTP**: Parse email content to get verification code
6. **Complete flow**: Use OTP to verify account
7. **Cleanup**: Delete temporary inbox

### Benefits

- ✅ Test real email delivery
- ✅ Verify email content and formatting
- ✅ No manual email checking
- ✅ Automated OTP extraction
- ✅ Parallel test execution
- ✅ No email service mocking needed

## Configuration

### Playwright Config (`playwright.config.js`)

```javascript
module.exports = defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,  // Sequential for signup tests
  workers: 1,            // One worker to avoid conflicts
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Environment Variables

```env
# Required for app
MONGO_URL=mongodb://127.0.0.1:27017/wanderlust

# Optional for email testing
FCE_API_KEY=your_freecustom_email_api_key

# Optional for SMS testing (not used in E2E yet)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Test configuration
BASE_URL=http://localhost:8080
```

## CI/CD Integration

### GitHub Actions

The project includes a GitHub Actions workflow (`.github/workflows/e2e-tests.yml`) that:

1. Sets up MongoDB service
2. Installs dependencies
3. Installs Playwright browsers
4. Creates admin user
5. Runs E2E tests
6. Uploads test reports and artifacts

### Setting Up CI

1. Add `FCE_API_KEY` to GitHub Secrets:
   - Go to repository Settings → Secrets and variables → Actions
   - Add new secret: `FCE_API_KEY`

2. Push to main/develop branch or create PR
3. Tests run automatically
4. View results in Actions tab

## Debugging Tests

### View Test Report

After running tests:
```bash
npx playwright show-report
```

### Debug Failed Test

```bash
npx playwright test --debug tests/e2e/signup.spec.js
```

### View Trace

```bash
npx playwright show-trace test-results/path-to-trace.zip
```

### Console Logs

Tests include detailed console logging:
```
🧪 Testing signup with email: pw-test-1234567890@ditapi.info
📝 Submitting registration form...
✓ Redirected to OTP verification page
📧 Waiting for email OTP...
✓ Received email OTP: 123456
📱 Using mobile OTP: 654321
🔐 Submitting OTP verification...
✓ Redirected to login page
✓ Success message displayed
🔑 Logging in with new credentials...
✓ Successfully logged in!
✓ User is authenticated
```

## Best Practices

### 1. Unique Test Data

Always generate unique test data:
```javascript
const timestamp = Date.now();
const testEmail = `test-${timestamp}@ditapi.info`;
const testUsername = `user${timestamp}`;
```

### 2. Cleanup

Clean up test data after each test:
```javascript
test.afterEach(async () => {
  await emailHelper.cleanupInbox(testEmail);
  // Delete test user from database if needed
});
```

### 3. Timeouts

Use appropriate timeouts for email delivery:
```javascript
const otp = await emailHelper.waitForOTP(email, {
  timeoutMs: 45000,  // 45 seconds for email delivery
  retries: 3         // Retry 3 times
});
```

### 4. Error Handling

Handle email service failures gracefully:
```javascript
try {
  const otp = await emailHelper.waitForOTP(email);
} catch (error) {
  console.warn('Email service failed, using fallback OTP');
  const otp = '123456'; // Fallback for testing
}
```

### 5. Parallel Execution

For signup tests, use sequential execution:
```javascript
test.describe.configure({ mode: 'serial' });
```

## Troubleshooting

### Issue: Tests timeout waiting for email

**Solutions**:
1. Check FCE_API_KEY is set correctly
2. Increase timeout: `timeoutMs: 60000`
3. Check email service status
4. Verify email is being sent (check server logs)

### Issue: OTP not found in email

**Solutions**:
1. Check email subject matches filter
2. Verify OTP format in email template
3. Use `extractOTPFromContent()` helper
4. Check email HTML/text content

### Issue: Tests fail in CI but pass locally

**Solutions**:
1. Ensure MongoDB service is running in CI
2. Check environment variables are set
3. Verify admin user is created before tests
4. Check network/firewall settings

### Issue: Browser not found

**Solution**:
```bash
npx playwright install chromium
```

### Issue: Port already in use

**Solutions**:
1. Stop other instances: `pkill -f "node app.js"`
2. Change port in config
3. Use `reuseExistingServer: true`

## Performance Tips

### 1. Reuse Server

In development, reuse existing server:
```javascript
webServer: {
  reuseExistingServer: !process.env.CI,
}
```

### 2. Parallel Tests

For independent tests, enable parallel execution:
```javascript
fullyParallel: true,
workers: 4,
```

### 3. Selective Testing

Run only changed tests:
```bash
npx playwright test --only-changed
```

### 4. Headed vs Headless

Use headless mode for faster execution:
```bash
npm run test:e2e  # Headless (default)
```

## Advanced Usage

### Custom Email Assertions

```javascript
test('verify email branding', async ({ page }) => {
  // ... trigger email ...
  
  const email = await emailHelper.waitForEmail(
    testEmail, 
    'Verification'
  );
  
  expect(email.from).toContain('wanderlust');
  expect(email.html).toContain('logo');
  expect(email.html).toContain('brand-color');
});
```

### Multiple Email Scenarios

```javascript
test('verify welcome email after signup', async ({ page }) => {
  // Complete signup
  // ...
  
  // Wait for welcome email
  const welcomeEmail = await emailHelper.waitForEmail(
    testEmail,
    'Welcome to Wanderlust'
  );
  
  expect(welcomeEmail).toBeTruthy();
});
```

### Email Content Testing

```javascript
test('verify email contains correct links', async ({ page }) => {
  const email = await emailHelper.waitForEmail(testEmail, 'Verify');
  
  const links = email.html.match(/href="([^"]+)"/g);
  expect(links).toContain('http://localhost:8080/auth/verify');
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [FreeCustom.email Documentation](https://freecustom.email/docs)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [E2E Testing Guide](https://playwright.dev/docs/intro)

## Support

For issues or questions:
1. Check test logs and screenshots
2. Review Playwright trace
3. Check FreeCustom.email dashboard
4. Verify environment configuration
5. Check server logs for OTP generation

## Next Steps

1. ✅ Set up FreeCustom.email account
2. ✅ Configure API key
3. ✅ Run tests locally
4. ✅ Set up CI/CD
5. ⬜ Add more test scenarios
6. ⬜ Integrate SMS testing
7. ⬜ Add performance tests
8. ⬜ Add accessibility tests
