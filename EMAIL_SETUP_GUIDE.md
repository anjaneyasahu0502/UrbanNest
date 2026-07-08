# Email Setup Guide for OTP Verification

## Current Issue
Email verification codes are not being sent to your inbox because the email service is not configured. Currently, OTPs are being logged to the server console.

## Solution: Configure Email Service

You have **3 options** to set up email verification:

---

## Option 1: Gmail (Recommended for Testing)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the steps to enable 2FA

### Step 2: Generate App Password
1. After enabling 2FA, go back to Security
2. Click on **2-Step Verification** again
3. Scroll down and click **App passwords**
4. Select app: **Mail**
5. Select device: **Other (Custom name)**
6. Enter name: **Wanderlust App**
7. Click **Generate**
8. **Copy the 16-character password** (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Update .env File
Add these lines to your `.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

Replace:
- `your-email@gmail.com` with your actual Gmail address
- `abcd efgh ijkl mnop` with the app password you generated

### Step 4: Restart Server
```bash
# Stop the server (Ctrl+C)
# Start again
npm start
```

### Step 5: Test
1. Go to http://localhost:8080/auth/register
2. Fill in the registration form with your real email
3. Check your Gmail inbox for the OTP

---

## Option 2: Outlook/Hotmail

### Step 1: Enable App Password
1. Go to https://account.microsoft.com/security
2. Click **Advanced security options**
3. Under **App passwords**, click **Create a new app password**
4. Copy the generated password

### Step 2: Update .env File
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-app-password
```

### Step 3: Restart and Test
```bash
npm start
```

---

## Option 3: SendGrid (Recommended for Production)

### Step 1: Sign Up
1. Go to https://sendgrid.com/
2. Sign up for a free account (100 emails/day free)

### Step 2: Create API Key
1. Go to Settings → API Keys
2. Click **Create API Key**
3. Name: **Wanderlust**
4. Permissions: **Full Access**
5. Copy the API key

### Step 3: Verify Sender Identity
1. Go to Settings → Sender Authentication
2. Click **Verify a Single Sender**
3. Fill in your details and verify your email

### Step 4: Update .env File
```env
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=your-sendgrid-api-key
```

### Step 5: Restart and Test
```bash
npm start
```

---

## Quick Setup (Gmail Example)

Here's a quick copy-paste template for Gmail:

```bash
# Add to .env file
cat >> .env << 'EOF'

# Email Configuration for OTP
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password-here
EOF
```

Then edit the file and replace with your actual credentials:
```bash
nano .env
# or
code .env
```

---

## Troubleshooting

### Issue: "Invalid login" error

**Solution for Gmail:**
1. Make sure 2FA is enabled
2. Use App Password, not your regular password
3. Remove spaces from the app password

**Solution for Outlook:**
1. Enable "Less secure app access" or use app password
2. Check if account is locked

### Issue: "Connection timeout"

**Solution:**
1. Check your firewall settings
2. Try port 465 with `secure: true`:
   ```env
   EMAIL_PORT=465
   ```
3. Check if your ISP blocks SMTP ports

### Issue: Emails going to spam

**Solution:**
1. Add your email to contacts
2. Mark first email as "Not Spam"
3. For production, use SendGrid or similar service

### Issue: Still not receiving emails

**Check server console:**
```bash
# Look for these messages:
Email not configured. OTP for user@example.com : 123456
# or
Email OTP error: [error message]
```

If you see OTPs in console, email service is not configured correctly.

---

## Testing Email Configuration

### Test Script

Create a test file `test-email.js`:

```javascript
require('dotenv').config();
const { sendEmailOTP } = require('./utils/otpService');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('EMAIL_USER:', process.env.EMAIL_USER);
  console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
  
  const testOTP = '123456';
  const testEmail = process.env.EMAIL_USER; // Send to yourself
  
  const result = await sendEmailOTP(testEmail, testOTP);
  console.log('Result:', result);
  
  if (result.success) {
    console.log('✓ Email sent! Check your inbox.');
  } else {
    console.log('✗ Email failed. Check configuration.');
  }
}

testEmail();
```

Run it:
```bash
node test-email.js
```

---

## Current Workaround (Development Only)

If you can't set up email right now, you can still test the signup flow:

### Step 1: Register a User
Fill in the registration form and submit.

### Step 2: Check Server Console
Look for output like:
```
Email not configured. OTP for user@example.com : 123456
SMS not configured. OTP for +1234567890 : 654321
```

### Step 3: Use Console OTPs
Copy the OTPs from the console and paste them into the verification form.

---

## Production Recommendations

For production deployment, use a dedicated email service:

### Best Options:
1. **SendGrid** - 100 emails/day free, reliable
2. **AWS SES** - Very cheap, scalable
3. **Mailgun** - Good for transactional emails
4. **Postmark** - Fast delivery, good reputation

### Why not Gmail for production?
- Daily sending limits (500 emails/day)
- Risk of account suspension
- Not designed for automated emails
- Poor deliverability for bulk emails

---

## Security Best Practices

1. **Never commit credentials to Git**
   ```bash
   # Make sure .env is in .gitignore
   echo ".env" >> .gitignore
   ```

2. **Use environment variables**
   - Never hardcode credentials in code
   - Use different credentials for dev/prod

3. **Rotate passwords regularly**
   - Change app passwords every 3-6 months
   - Revoke unused app passwords

4. **Monitor email sending**
   - Check for failed sends
   - Monitor bounce rates
   - Watch for spam complaints

---

## Next Steps

1. ✅ Choose an email service (Gmail recommended for testing)
2. ✅ Generate app password
3. ✅ Update `.env` file
4. ✅ Restart server
5. ✅ Test registration with real email
6. ✅ Check inbox for OTP
7. ✅ Complete verification

---

## Need Help?

If you're still having issues:

1. **Check server logs** for error messages
2. **Verify credentials** are correct in `.env`
3. **Test with the test script** above
4. **Try a different email service**
5. **Check firewall/antivirus** settings

For immediate testing, use the console OTP workaround described above.
