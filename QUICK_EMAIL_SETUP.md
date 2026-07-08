# Quick Email Setup - Get OTPs in Your Inbox!

## 🚨 Current Issue
Your email verification codes are being logged to the **server console** instead of being sent to your inbox because email service is not configured.

## ✅ Quick Fix (3 Steps)

### Option A: Interactive Setup (Easiest)
```bash
npm run setup:email
```
Follow the prompts to configure Gmail, Outlook, or SendGrid.

### Option B: Manual Setup (Gmail)

#### Step 1: Get Gmail App Password
1. Go to https://myaccount.google.com/apppasswords
2. Sign in to your Google Account
3. Select app: **Mail**
4. Select device: **Other** → Enter "Wanderlust"
5. Click **Generate**
6. **Copy the 16-character password** (looks like: `abcd efgh ijkl mnop`)

#### Step 2: Add to .env File
Open your `.env` file and add:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```
Replace with your actual email and app password (remove spaces from password).

#### Step 3: Test It
```bash
# Test email configuration
npm run test:email

# If successful, restart server
npm start
```

## 🧪 Test Your Setup

```bash
# Test with your email
npm run test:email

# Test with specific email
node test-email.js someone@example.com
```

## 🔍 Troubleshooting

### "Invalid login" Error
- ✅ Make sure you're using **App Password**, not your regular Gmail password
- ✅ Enable 2-Factor Authentication first
- ✅ Remove spaces from the app password

### Still Not Working?
Check the server console when you register:
```bash
# You should see:
✓ OTP sent to email successfully

# Instead of:
Email not configured. OTP for user@example.com : 123456
```

## 🎯 Current Workaround (For Testing Now)

If you can't set up email right now, you can still test:

1. **Register a user** at http://localhost:8080/auth/register
2. **Check your terminal/console** where the server is running
3. **Look for this line:**
   ```
   Email not configured. OTP for user@example.com : 123456
   SMS not configured. OTP for +1234567890 : 654321
   ```
4. **Copy the OTPs** and paste them in the verification form

## 📚 Need More Help?

- **Detailed Guide**: See `EMAIL_SETUP_GUIDE.md`
- **Other Email Services**: Gmail, Outlook, SendGrid, Custom SMTP
- **Production Setup**: Recommendations for deployment

## 🎉 After Setup

Once configured:
1. ✅ OTPs will be sent to your inbox
2. ✅ Professional HTML email template
3. ✅ 10-minute OTP expiry
4. ✅ No more console checking!

---

**Quick Commands:**
```bash
npm run setup:email    # Interactive setup
npm run test:email     # Test configuration
npm start              # Restart server
```
