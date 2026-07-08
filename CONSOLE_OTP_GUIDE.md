# Finding OTPs in Console (Temporary Workaround)

## Why Are OTPs in the Console?

Your email service is not configured yet, so the system logs OTPs to the server console for testing purposes.

## How to Find Your OTPs

### Step 1: Keep Your Server Terminal Open

When you run `npm start`, keep that terminal window visible:

```
$ npm start

> airbnb@1.0.0 start
> node app.js

connected to DB
server is listening to port 8080
```

### Step 2: Register a New User

Go to http://localhost:8080/auth/register and fill in the form:
- Username: testuser
- Email: test@example.com
- Mobile: +1234567890
- Password: password123
- Confirm Password: password123

Click "Sign Up"

### Step 3: Look at Your Terminal

After clicking "Sign Up", look at your server terminal. You'll see:

```
Email not configured. OTP for test@example.com : 123456
SMS not configured. OTP for +1234567890 : 654321
```

### Step 4: Copy the OTPs

Copy both OTPs:
- **Email OTP**: 123456
- **Mobile OTP**: 654321

### Step 5: Enter OTPs in Browser

The browser will redirect you to the verification page.
Enter the OTPs you copied from the console:

```
Email OTP:  [123456]
Mobile OTP: [654321]
```

Click "Verify & Complete Registration"

### Step 6: Success!

You'll be redirected to the login page. You can now login with your credentials!

---

## Visual Example

```
┌─────────────────────────────────────────────────────────────┐
│ Terminal (Server Console)                                    │
├─────────────────────────────────────────────────────────────┤
│ $ npm start                                                  │
│                                                              │
│ > airbnb@1.0.0 start                                        │
│ > node app.js                                               │
│                                                              │
│ connected to DB                                             │
│ server is listening to port 8080                            │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Email not configured. OTP for test@example.com : 123456 │ │ ← Copy this!
│ │ SMS not configured. OTP for +1234567890 : 654321        │ │ ← And this!
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Browser (Verification Page)                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Verify Your Account                                        │
│                                                              │
│  Email OTP                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 123456                                                │  │ ← Paste here
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Mobile OTP                                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ 654321                                                │  │ ← Paste here
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Verify & Complete Registration]                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Tips

### Tip 1: Keep Terminal Visible
Position your windows so you can see both the browser and terminal:
- Browser on left half of screen
- Terminal on right half of screen

### Tip 2: Use Copy-Paste
- Select the OTP numbers in terminal
- Right-click → Copy (or Ctrl+C / Cmd+C)
- Paste into browser form

### Tip 3: OTPs Are Different Each Time
Each registration generates new random OTPs. Always check the terminal for the latest ones.

### Tip 4: OTPs Expire
OTPs expire after 10 minutes. If you wait too long, you'll need to click "Resend OTPs" and check the terminal again for new codes.

---

## Permanent Solution

To receive OTPs in your email inbox instead of console:

### Quick Setup (3 minutes)
```bash
npm run setup:email
```

### Or Manual Setup
1. Read `QUICK_EMAIL_SETUP.md`
2. Configure Gmail App Password
3. Add to `.env` file
4. Restart server

After setup, OTPs will be sent to your email automatically! 📧

---

## Common Questions

### Q: I don't see the OTPs in my terminal
**A:** Make sure you're looking at the terminal where you ran `npm start`, not a different terminal window.

### Q: The terminal shows an error instead
**A:** Share the error message - it might be a different issue.

### Q: Can I use the same OTPs multiple times?
**A:** No, OTPs are single-use and expire after 10 minutes.

### Q: What if I close the terminal?
**A:** The OTPs are lost. You'll need to restart the server and register again, or click "Resend OTPs" on the verification page.

### Q: Is this secure?
**A:** For development/testing, yes. For production, you MUST configure real email service.

---

## Next Steps

1. ✅ Use console OTPs to test the signup flow
2. ✅ Verify everything works
3. ✅ Set up email service using `npm run setup:email`
4. ✅ Test with real emails
5. ✅ Deploy to production with proper email service

---

**Need help?** Check these guides:
- `QUICK_EMAIL_SETUP.md` - Fast email setup
- `EMAIL_SETUP_GUIDE.md` - Detailed email configuration
- `TESTING_GUIDE.md` - Complete testing guide
