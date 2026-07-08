# Testing Guide for Signup Feature

## Quick Test Steps

### 1. Access the Application
Open your browser and navigate to: `http://localhost:8080`

### 2. Navigate to Sign Up
- Click on "Login" in the navbar
- On the login page, click "Sign Up" link at the bottom

### 3. Fill Registration Form
**URL**: `http://localhost:8080/auth/register`

Fill in the form with:
- **Username**: testuser
- **Email**: test@example.com
- **Mobile**: +1234567890
- **Password**: password123
- **Confirm Password**: password123

Click "Sign Up"

### 4. Check Console for OTPs
Since email/SMS services may not be configured, check your terminal/console for:
```
Email OTP for test@example.com : 123456
Mobile OTP for +1234567890 : 654321
```

### 5. Enter OTPs
**URL**: `http://localhost:8080/auth/verify-otp`

Enter both OTPs:
- **Email OTP**: (6-digit code from console)
- **Mobile OTP**: (6-digit code from console)

Click "Verify & Complete Registration"

### 6. Sign In
**URL**: `http://localhost:8080/auth/login`

You'll be redirected to the login page. Sign in with:
- **Username**: testuser
- **Password**: password123

### 7. Success!
You should now be logged in and redirected to the listings page.

## Testing with Real Email/SMS

### Configure Email (Gmail)
1. Edit `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

2. Restart the server:
```bash
npm start
```

3. Register with a real email address
4. Check your email inbox for the OTP

### Configure SMS (Twilio)
1. Sign up at https://www.twilio.com/
2. Get a phone number and credentials
3. Edit `.env` file:
```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

4. Restart the server
5. Register with a real mobile number
6. Check your phone for the SMS OTP

## Testing Error Cases

### 1. Duplicate Username
Try registering with username "admin" (already exists)
- **Expected**: Error message "Username already exists"

### 2. Password Mismatch
Enter different passwords in Password and Confirm Password fields
- **Expected**: Error message "Passwords do not match"

### 3. Invalid Email
Enter an invalid email like "notanemail"
- **Expected**: Browser validation error

### 4. Invalid Mobile
Enter a mobile without country code like "1234567890"
- **Expected**: May work but recommended format is +1234567890

### 5. Wrong OTP
Enter incorrect OTPs on verification page
- **Expected**: Error message "Invalid email OTP" or "Invalid mobile OTP"

### 6. Expired OTP
Wait 10+ minutes after registration, then try to verify
- **Expected**: Error message "OTP expired"
- **Solution**: Click "Resend OTPs" button

### 7. Login Without Verification
Try to login before completing OTP verification
- **Expected**: Error message "Please verify your email and mobile number first"

## Testing Resend OTP

1. Register a new user
2. On the OTP verification page, click "Resend OTPs"
3. Check console for new OTPs
4. Enter the new OTPs to verify

## Testing Navigation

### From Login to Register
1. Go to `http://localhost:8080/auth/login`
2. Click "Sign Up" link at the bottom
3. Should navigate to registration page

### From Register to Login
1. Go to `http://localhost:8080/auth/register`
2. Click "Sign In" link at the bottom
3. Should navigate to login page

## Verifying Database Changes

### Check User in MongoDB
```bash
mongosh wanderlust
db.users.find().pretty()
```

You should see:
- username
- email
- mobile
- password (hashed)
- emailVerified: true
- mobileVerified: true
- createdAt

## Common Issues and Solutions

### Issue: OTPs not showing in console
**Solution**: Make sure you're looking at the correct terminal where `npm start` is running

### Issue: "No pending registration found"
**Solution**: Your session may have expired. Start registration again

### Issue: Email/SMS not sending
**Solution**: 
1. Check environment variables are set correctly
2. For Gmail, ensure you're using an App Password, not your regular password
3. For Twilio, verify your account is active and has credits

### Issue: "User already exists"
**Solution**: Use a different username, email, or mobile number

### Issue: Can't login after verification
**Solution**: 
1. Check that both emailVerified and mobileVerified are true in database
2. Ensure you're using the correct username and password

## Performance Testing

### Test Multiple Registrations
1. Register 5-10 users in quick succession
2. Verify all receive OTPs
3. Complete verification for all
4. Login with each account

### Test Concurrent OTP Requests
1. Start registration for User A
2. Before verifying, start registration for User B
3. Both should receive separate OTPs
4. Verify both accounts independently

## Security Testing

### Test OTP Expiry
1. Register a user
2. Wait 11 minutes
3. Try to verify with the OTPs
4. Should fail with "OTP expired"

### Test Session Security
1. Register a user
2. Clear browser cookies
3. Try to access `/auth/verify-otp` directly
4. Should redirect to registration

### Test Password Hashing
1. Register a user
2. Check database: `db.users.findOne({username: "testuser"})`
3. Password should be a bcrypt hash, not plain text

## Cleanup After Testing

### Remove Test Users
```bash
mongosh wanderlust
db.users.deleteMany({username: {$regex: /^test/}})
```

Or use the reset script:
```bash
npm run reset:users
```

## Automated Testing

Run the test suite:
```bash
npm test
```

This will run any existing tests plus verify the application starts correctly.

## Next Steps

After successful testing:
1. Configure production email service
2. Configure production SMS service
3. Set up proper session store (Redis)
4. Enable HTTPS
5. Add rate limiting for OTP requests
6. Implement account recovery
7. Add email verification links as alternative to OTP
