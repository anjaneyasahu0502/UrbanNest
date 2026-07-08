require('dotenv').config();
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const methodOverride = require('method-override');
const ejsMate = require('ejs-mate');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const ExpressError = require('./utils/ExpressError.js');
const Listing = require('./models/listing.js');
const Booking = require('./models/booking.js');
const Review = require('./models/review.js');
const User = require('./models/user.js');

const listingsRouter   = require('./routes/listings.js');
const reviewsRouter    = require('./routes/reviews.js');
const bookingsRouter   = require('./routes/bookings.js');
const bookingsUserRouter = require('./routes/bookingsUser.js');
const bookingsHostRouter = require('./routes/bookingsHost.js');
const webhooksRouter   = require('./routes/webhooks.js');
const chatbotRouter    = require('./routes/chatbot.js');
const authRouter       = require('./routes/auth.js');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017/urbannest';
const PORT = process.env.PORT || 8080;

async function main() {
    await mongoose.connect(MONGO_URL);
    console.log('Connected to DB');
}

if (require.main === module) {
    main()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`UrbanNest backend running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error('MongoDB connection failed:', err.message);
            process.exit(1);
        });
} else {
    main().catch((err) => {
        console.error('MongoDB connection failed:', err.message);
    });
}

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, cb) => {
        // Allow: no origin (same-origin forms, curl), null origin (file://, sandboxed iframes),
        // empty allowedOrigins list (dev), or explicitly configured origins.
        if (!origin || origin === 'null') return cb(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return cb(null, true);
        }
        cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
}));

// ── View engine ───────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.engine('ejs', ejsMate);

// ── Body / method ────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// ── Static files ─────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
}));

app.set('trust proxy', 1);

const limiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use(limiter);

// ── Session / flash ───────────────────────────────────────────────────────────
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
    },
}));
app.use(flash());

// ── Passport ──────────────────────────────────────────────────────────────────
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(async (username, password, done) => {
    try {
        const user = await User.findOne({ username });
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        const valid = await user.validatePassword(password);
        if (!valid) return done(null, false, { message: 'Incorrect password.' });
        return done(null, user);
    } catch (err) {
        return done(err);
    }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
    try {
        const u = await User.findById(id);
        done(null, u);
    } catch (e) {
        done(e);
    }
});

// ── Locals ────────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.locals.currentPath  = req.path;
    res.locals.success      = req.flash('success');
    res.locals.error        = req.flash('error');
    res.locals.currentUser  = req.user || null;
    next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/listings', listingsRouter);
app.use('/listings/:id/reviews', reviewsRouter);
app.use('/auth', authRouter);
app.use('/listings/:id/bookings', bookingsRouter);
app.use('/bookings/host', bookingsHostRouter);
app.use('/bookings', bookingsUserRouter);
app.use('/webhooks', webhooksRouter);
app.use('/sahayata', chatbotRouter);

// ── Home ──────────────────────────────────────────────────────────────────────
app.get('/', async (req, res, next) => {
    try {
        const [listingCount, bookingCount, reviewCount, userCount, recentListings, recentBookings] =
            await Promise.all([
                Listing.countDocuments(),
                Booking.countDocuments(),
                Review.countDocuments(),
                User.countDocuments(),
                Listing.find({}).sort({ _id: -1 }).limit(4).populate('author'),
                Booking.find({}).sort({ createdAt: -1 }).limit(4).populate('listing').populate('user'),
            ]);

        res.render('home', {
            stats: { listingCount, bookingCount, reviewCount, userCount },
            recentListings,
            recentBookings,
        });
    } catch (err) {
        next(err);
    }
});

app.get('/privacy', (req, res) => {
    res.render('info', {
        title: 'Privacy Policy',
        heading: 'Privacy Policy',
        message: 'UrbanNest does not sell or share your personal data with third parties.',
    });
});

app.get('/terms', (req, res) => {
    res.render('info', {
        title: 'Terms and Conditions',
        heading: 'Terms and Conditions',
        message: 'By using UrbanNest you agree to our terms of service.',
    });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, 'Page Not Found'));
});

// ── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    if (err.name === 'CastError') err = new ExpressError(404, 'Listing not found');
    if (err.name === 'ValidationError' && !err.statusCode) err = new ExpressError(400, 'Validation failed');
    const { statusCode = 500, message = 'Something went wrong' } = err;
    res.status(statusCode).render('error', { statusCode, message, err });
});

module.exports = app;
