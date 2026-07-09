const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// configure cloudinary if env present
if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_KEY,
        api_secret: process.env.CLOUDINARY_SECRET
    });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: function (req, file, cb) {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});
const upload = multer({ storage });
const wrapAsync = require("../utils/wrapAsync.js");
const { validateListing, loadListing, isLoggedIn, isListingAuthor, isAdmin } = require("../appMiddleware.js");
const { buildMongoSearchQuery, getSearchAssistant } = require("../utils/searchAssistant.js");
const Booking = require("../models/booking.js");
const Review = require("../models/review.js");

router.get("/", wrapAsync(async (req, res) => {
    const { q } = req.query;
    const assistant = q ? await getSearchAssistant(q) : null;
    const query = q ? buildMongoSearchQuery(assistant.analysis) : {};

    const allListings = await Listing.find(query).sort({ _id: -1 });
    res.render("listings/index", { allListings, q: q || "", assistant });
}));

router.get("/search/assistant", wrapAsync(async (req, res) => {
    const { q } = req.query;
    const assistant = await getSearchAssistant(q || "");
    res.json(assistant);
}));

router.get("/new", isAdmin, (req, res) => {
    res.render("listings/new", { listing: {}, error: null });
});

router.post("/", isAdmin, upload.single('imageFile'), validateListing("listings/new"), wrapAsync(async (req, res) => {
    const newListing = new Listing(req.body.listing);
    if (req.file) {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const res = await cloudinary.uploader.upload(req.file.path, { folder: 'urbannest' });
            newListing.image = { url: res.secure_url };
        } else {
            newListing.image = { url: `/uploads/${req.file.filename}` };
        }
    }
    // prefer explicit URL if provided
    if (req.body.listing && req.body.listing.image && req.body.listing.image.url) {
        newListing.image = { url: req.body.listing.image.url };
    }
    newListing.author = req.user._id;
    await newListing.save();
    res.redirect(`/listings/${newListing._id}`);
}));

router.get("/:id", loadListing, wrapAsync(async (req, res) => {
    const listing = await Listing.findById(req.params.id)
        .populate({ path: 'reviews', populate: { path: 'author' } })
        .populate('author');

    let canReview = false;
    let alreadyReviewed = false;

    if (req.user) {
        const now = new Date();
        // Check completed paid stay
        const completedBooking = await Booking.findOne({
            listing: listing._id,
            user: req.user._id,
            paid: true,
            checkOut: { $lt: now },
        });

        if (completedBooking) {
            // Check if already reviewed
            alreadyReviewed = await Review.exists({
                author: req.user._id,
                _id: { $in: listing.reviews },
            });
            canReview = !alreadyReviewed;
        }
    }

    res.render("listings/show", { listing, canReview: !!canReview, alreadyReviewed: !!alreadyReviewed });
}));

router.get("/:id/edit", isAdmin, loadListing, (req, res) => {
    const { listing } = res.locals;
    res.render("listings/edit", { listing, error: null });
});

router.put("/:id", isAdmin, loadListing, upload.single('imageFile'), validateListing("listings/edit"), wrapAsync(async (req, res) => {
    const { id } = req.params;
    const update = { ...req.body.listing };
    if (req.file) {
        if (process.env.CLOUDINARY_CLOUD_NAME) {
            const res = await cloudinary.uploader.upload(req.file.path, { folder: 'urbannest' });
            update.image = { url: res.secure_url };
        } else {
            update.image = { url: `/uploads/${req.file.filename}` };
        }
    }

    await Listing.findByIdAndUpdate(id, update, { runValidators: true });

    res.redirect(`/listings/${id}`);
}));

router.delete("/:id", isAdmin, loadListing, wrapAsync(async (req, res) => {
    const { id } = req.params;

    await Listing.findByIdAndDelete(id);
    res.redirect("/listings");
}));

module.exports = router;