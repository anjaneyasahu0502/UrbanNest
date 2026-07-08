# Signup Feature with OTP Verification

## Overview
This document describes the new signup feature with email and mobile OTP verification implemented in the Wanderlust application.

## Features Implemented

### 1. Enhanced User Model
- **Email field**: Required, unique email address
- **Mobile field**: Required, unique mobile number with country code
- **Email verification**: Boolean flag for email verification status
- **Mobile verification**: Boolean flag for mobile verification status
- **OTP storage**: Secure storage of OTPs with expiry time
- **OTP expiry**: 10-minute expiration for security

### 2. Registration Flow

#### Step 1: Sign Up Form
- **URL**: `/auth/register`
- **Fields**:
  - Username (minimum 3 characters)
  - Email address (valid email format)
  - Mobile number (with country code, e.g., +1234567890)
  - Password (minimum 6 characters)
  - Confirm Password (must match)
- **Validation**:
  - All fields are required
  - Email format validation
  - Mobile number format validation (10-15 digits with optional +)
  - Password strength check
  - Password confirmation match
  - Duplicate username/email/mobile check

#### Step 2: OTP Verification
- **URL**: `/auth/verify-otp`
- **Process**:
  1. System generates two 6-digit OTPs
  2. Email OTP sent to user's email address
  3. Mobile OTP sent to user's mobile number via SMS
  4. User enters both OTPs on verification page
  5. System validates both OTPs
  6. Upon success, account is activated

#### Step 3: Completion
- User is redirected to login page
- Account is now fully verified and active
- User can sign in with username and password

### 3. OTP Services

#### Email OTP Service
- **Provider**: Nodemailer (supports Gmail, Outlook, etc.)
- **Configuration**: Via environment variables
- **Fallback**: Logs OTP to console if email service not configured
- **Template**: Professional HTML email with branding

#### SMS OTP Service
- **Provider**: Twilio
- **Configuration**: Via environment variables
- **Fallback**: Logs OTP to console if SMS service not configured
- **Format**: Simple text message with OTP

### 4. Security Features
- **OTP Expiry**: 10 minutes from generation
- **Unique OTPs**: Different OTPs for email and mobile
- **Session-based**: Pending registration stored in session
- **Password Hashing**: Bcrypt with salt rounds
- **Rate Limiting**: Prevents OTP spam
- **Resend Functionality**: Users can request new OTPs

### 5. User Experience Enhancements
- **Cross-linking**: Easy navigation between Sign In and Sign Up pages
- **Clear Instructions**: Helpful text and placeholders
- **Error Messages**: Specific, actionable error messages
- **Success Messages**: Confirmation at each step
- **Responsive Design**: Mobile-friendly forms
- **Auto-focus**: OTP input fields for better UX
- **Paste Support**: Users can paste OTPs from clipboard

## Configuration

### Environment Variables

```env
# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS Configuration
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### Gmail Setup
1. Enable 2-Factor Authentication on your Google Account
2. Go to Security → App Passwords
3. Generate a new app password for "Mail"
4. Use this password in `EMAIL_PASSWORD`

### Twilio Setup
1. Sign up at https://www.twilio.com/
2. Get a phone number
3. Copy Account SID and Auth Token
4. Add credentials to `.env` file

## Testing

### Development Mode (Without Email/SMS Services)
If email and SMS services are not configured, OTPs will be logged to the console:

```
Email OTP for user@example.com : 123456
Mobile OTP for +1234567890 : 654321
```

This allows testing without setting up external services.

### Test User Creation
Run the migration script to update existing users:
```bash
npm run migrate:users
```

Create/update admin user:
```bash
node scripts/createAdmin.js
```

## API Endpoints

### GET /auth/register
Displays the registration form

### POST /auth/register
Processes registration and sends OTPs
- **Body**: username, email, mobile, password, confirmPassword
- **Success**: Redirects to `/auth/verify-otp`
- **Error**: Returns to registration with error message

### GET /auth/verify-otp
Displays OTP verification form

### POST /auth/verify-otp
Verifies OTPs and activates account
- **Body**: emailOTP, mobileOTP
- **Success**: Redirects to `/auth/login`
- **Error**: Returns to verification with error message

### POST /auth/resend-otp
Resends OTPs to user
- **Success**: Redirects to `/auth/verify-otp` with success message
- **Error**: Returns with error message

### GET /auth/login
Displays login form with link to registration

### POST /auth/login
Authenticates user (only if verified)
- **Body**: username, password
- **Success**: Redirects to `/listings`
- **Error**: Returns to login with error message

## Database Schema

```javascript
{
  username: String (required, unique),
  email: String (required, unique),
  mobile: String (required, unique),
  password: String (required, hashed),
  emailVerified: Boolean (default: false),
  mobileVerified: Boolean (default: false),
  emailOTP: String (temporary),
  mobileOTP: String (temporary),
  otpExpiry: Date (temporary),
  createdAt: Date (default: now)
}
```

## Error Handling

### Registration Errors
- Username already exists
- Email already registered
- Mobile number already registered
- Passwords don't match
- Password too short
- Invalid email format
- Invalid mobile format

### Verification Errors
- Invalid email OTP
- Invalid mobile OTP
- OTP expired (after 10 minutes)
- No pending registration found

### Login Errors
- Account not verified
- Incorrect username
- Incorrect password

## Future Enhancements
- Email verification link as alternative to OTP
- SMS verification for password reset
- Two-factor authentication for login
- Social media authentication (Google, Facebook)
- Remember device functionality
- Account recovery options
- Email notifications for account activities

## Migration Guide

For existing installations:

1. **Install new dependencies**:
   ```bash
   npm install
   ```

2. **Update environment variables**:
   ```bash
   cp .env.example .env
   # Add email and SMS configuration
   ```

3. **Migrate existing users**:
   ```bash
   npm run migrate:users
   ```

4. **Update admin user**:
   ```bash
   node scripts/createAdmin.js
   ```

5. **Restart application**:
   ```bash
   npm start
   ```

## Support

For issues or questions:
- Check console logs for OTPs in development mode
- Verify environment variables are set correctly
- Ensure MongoDB is running
- Check email/SMS service credentials
- Review error messages for specific issues
