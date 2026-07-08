const express=require("express");
const app=express();
const mongoose=require("mongoose");
require("dotenv").config();
const path=require("path");
const methodOverride = require("method-override");
const ejsMate=require("ejs-mate");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing.js");
const Booking = require("./models/booking.js");
const Review = require("./models/review.js");
const User = require("./models/user.js");
const listingsRouter = require("./routes/listings.js");
const reviewsRouter = require("./routes/reviews.js");
const bookingsRouter = require('./routes/bookings.js');
const bookingsUserRouter = require('./routes/bookingsUser.js');
const bookingsHostRouter = require('./routes/bookingsHost.js');
const webhooksRouter = require('./routes/webhooks.js');
const chatbotRouter = require('./routes/chatbot.js');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const authRouter = require('./routes/auth.js');

const MONGO_URL = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/urbannest";

async function main(){
    await mongoose.connect(MONGO_URL);
    console.log("connected to DB");
}

if (require.main === module) {
    main()
        .then(() => {
            app.listen(8080, () => {
                console.log("server is listening to port 8080");
            });
        })
        .catch((err) => {
            console.error("MongoDB connection failed:", err.message);
            process.exit(1);
        });
} else {
    main().catch((err) => {
        console.error("MongoDB connection failed:", err.message);
    });
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

// Security headers
// Allow cross-origin resources (images from external hosts like Pexels)
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    // disable helmet's default contentSecurityPolicy so we can control img sources separately if needed
    contentSecurityPolicy: false,
    // disable the Cross-Origin-Embedder-Policy (require-corp) which blocks loading many third-party images
    crossOriginEmbedderPolicy: false,
}));

// Basic rate limiter
const limiter = rateLimit({ windowMs: 1 * 60 * 1000, max: 100 });
app.use(limiter);

app.use(cookieParser());
app.use(session({
    secret: 'dev-secret-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24, httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));

app.use(flash());
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
    try { const u = await User.findById(id); done(null, u); } catch (e) { done(e); }
});

app.use((req, res, next) => {
    res.locals.currentPath = req.path;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user || null;
    next();
});

app.use("/listings", listingsRouter);
app.use("/listings/:id/reviews", reviewsRouter);
app.use('/auth', authRouter);
app.use('/listings/:id/bookings', bookingsRouter);
app.use('/bookings/host', bookingsHostRouter);
app.use('/bookings', bookingsUserRouter);
app.use('/webhooks', webhooksRouter);
app.use('/sahayata', chatbotRouter);

app.get("/", async (req, res, next) => {
    try {
        const [listingCount, bookingCount, reviewCount, userCount, recentListings, recentBookings] = await Promise.all([
            Listing.countDocuments(),
            Booking.countDocuments(),
            Review.countDocuments(),
            User.countDocuments(),
            Listing.find({}).sort({ _id: -1 }).limit(4).populate("author"),
            Booking.find({}).sort({ createdAt: -1 }).limit(4).populate("listing").populate("user"),
        ]);

        res.render("home", {
            stats: {
                listingCount,
                bookingCount,
                reviewCount,
                userCount,
            },
            recentListings,
            recentBookings,
        });
    } catch (err) {
        next(err);
    }
})

app.get("/privacy", (req, res) => {
    res.render("info", {
        title: "Privacy Policy",
        heading: "Privacy Policy",
        message: "This demo project does not collect or store user data yet.",
    });
});

app.get("/terms", (req, res) => {
    res.render("info", {
        title: "Terms and Conditions",
        heading: "Terms and Conditions",
        message: "Listings are managed for interview practice and demo purposes only.",
    });
});

app.all(/.*/, (req, res, next) => {
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) => {
    if (err.name === "CastError") {
        err = new ExpressError(404, "Listing not found");
    }

    if (err.name === "ValidationError" && !err.statusCode) {
        err = new ExpressError(400, "Validation failed");
    }

    const { statusCode = 500, message = "Something went wrong" } = err;
    res.status(statusCode).render("error", { statusCode, message, err });
});

module.exports = app;