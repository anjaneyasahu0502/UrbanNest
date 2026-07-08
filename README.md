<<<<<<< HEAD
# UrbanNest - India's Premier Urban Accommodation Platform

Modern full-stack platform for urban accommodations across India, featuring AI-powered travel assistance.

Quick start:

```bash
npm install
cp .env.example .env
npm run seed    # populate sample listings
node scripts/createAdmin.js   # create test user: admin/password
npm start
```

Open http://localhost:8080 and use `admin` / `password` to log in.

## Features

### 🏙️ Urban Accommodations
- Browse properties in major Indian cities
- Advanced search with AI-powered suggestions
- Real-time availability and booking
- Secure payment integration with Stripe

### 🤖 Sahayata AI Assistant
- Groq-powered chatbot for travel guidance
- Information about Indian cities, cuisine, and culture
- IT hubs and business district details
- Tourist attractions and local insights

### 📧 Email Verification
- Secure signup with email OTP
- 6-digit codes with unique digits
- Professional email templates
- 10-minute expiry for security

### 🎨 Indian-Themed Design
- Bootstrap with Indian color palette
- Saffron, white, and green accents
- Cultural elements and icons
- Responsive and modern UI

## New Signup Feature with OTP Verification

The application now includes a comprehensive signup system with email and mobile verification:

### Features
- **Email Verification**: Users receive a 6-digit OTP via email
- **Mobile Verification**: Users receive a 6-digit OTP via SMS
- **Dual Verification**: Both email and mobile must be verified to complete registration
- **OTP Expiry**: OTPs expire after 10 minutes
- **Resend Functionality**: Users can request new OTPs if needed
- **Cross-linking**: Easy navigation between Sign In and Sign Up pages

### Setup for OTP Services

#### Email OTP (using Gmail)
1. Add to your `.env` file:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

2. For Gmail, generate an App Password:
   - Go to Google Account Settings → Security
   - Enable 2-Factor Authentication
   - Generate an App Password for "Mail"
   - Use that password in `EMAIL_PASSWORD`

#### SMS OTP (using Twilio)
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get your Account SID, Auth Token, and Phone Number
3. Add to your `.env` file:
```env
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note**: If email/SMS services are not configured, OTPs will be logged to the console for development/testing purposes.

### User Registration Flow
1. User fills signup form with username, email, mobile, and password
2. System sends OTPs to both email and mobile
3. User enters both OTPs on verification page
4. Upon successful verification, account is activated
5. User can now sign in with their credentials

Environment variables
- `MONGO_URL` — MongoDB connection string. Defaults to `mongodb://127.0.0.1:27017/wanderlust` if not set.
- `GROQ_API_KEY` — Groq AI API key for AI-powered live search suggestions and Sahayata chatbot.
- `GROQ_MODEL` — optional Groq model name, defaults to `llama-3.3-70b-versatile`.
- `PEXELS_API_KEY` — optional Pexels API key used by the seeder to fetch real images for generated listings. If unset, the seeder falls back to bundled sample images.
- `SEED_LISTING_COUNT` — optional number of generated listings for `npm run seed` (max supported by curated places list).
- `STRIPE_SECRET` — your Stripe secret key (optional). When set, checkout will redirect users to Stripe for payment.
- `STRIPE_WEBHOOK_SECRET` — optional webhook signing secret for `checkout.session.completed` verification.
- `EMAIL_HOST` — SMTP host for sending email OTPs (default: smtp.gmail.com)
- `EMAIL_PORT` — SMTP port (default: 587)
- `EMAIL_USER` — Email address for sending OTPs
- `EMAIL_PASSWORD` — Email password or app-specific password
- `TWILIO_ACCOUNT_SID` — Twilio Account SID for SMS OTPs
- `TWILIO_AUTH_TOKEN` — Twilio Auth Token
- `TWILIO_PHONE_NUMBER` — Twilio phone number for sending SMS

Running tests
- `npm test` will run the Jest test suite (includes a basic smoke test).
- `npm run test:e2e` will run Playwright E2E tests for signup and authentication flows.
- `npm run test:e2e:ui` will open Playwright's interactive UI for debugging tests.
- `npm run setup:e2e` will setup the E2E testing environment (install browsers, create admin user).

## E2E Testing with FreeCustom.email

The project includes comprehensive E2E tests using Playwright and FreeCustom.email for real email verification testing.

### Quick Start
```bash
# Setup E2E environment
npm run setup:e2e

# Run E2E tests
npm run test:e2e

# Interactive mode (recommended)
npm run test:e2e:ui
```

### FreeCustom.email Setup (Optional)
For real email testing:
1. Sign up at [FreeCustom.email](https://freecustom.email/)
2. Get your API key
3. Add to `.env`: `FCE_API_KEY=your_key_here`

Without the API key, tests will use fallback OTPs from console logs.

See [E2E_TESTING_GUIDE.md](./E2E_TESTING_GUIDE.md) for detailed documentation.

Image uploads
- Uploaded images are stored locally under `public/uploads/` by default using `multer`. Add a file when creating or editing a listing.

Live search
- The navbar search uses Groq to interpret city and country queries in real time.
- If `GROQ_API_KEY` is not set, the app falls back to local keyword matching.

API-generated seed listings
- `npm run seed` now generates listings across many real cities/countries via Groq.
- If API generation fails or no `GROQ_API_KEY` is present, it falls back to static local sample listings.

Stripe webhooks
- If you configure `STRIPE_WEBHOOK_SECRET`, expose `/webhooks/stripe` to Stripe and it will be used to confirm payments.

Notes
- After pulling changes, run `npm install` to install new dependencies (`nodemailer`, `twilio`).
- This project is a demo and lacks production-ready hardening — secure secrets, enable HTTPS, and configure persistent image storage for production.
=======
# UrbanNest
>>>>>>> b1acb9b259a7f10172af967759a91deb2c9eeca2
