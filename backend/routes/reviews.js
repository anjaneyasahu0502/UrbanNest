const express = require("express");
const router = express.Router({ mergeParams: true });
const Listing = require("../models/listing.js");
const Review = require("../models/review.js");
const Booking = require("../models/booking.js");
const ExpressError = require("../utils/ExpressError.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { loadListing, isLoggedIn, isReviewAuthor, isAdmin } = require("../appMiddleware.js");

router.use(loadListing);

const validateReview = (req, res, next) => {
    const { rating, comment } = req.body.review || {};
    const ratingValue = Number(rating);

    if (!comment || comment.trim().length < 10) {
        throw new ExpressError(400, "Review comment must be at least 10 characters");
    }

    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        throw new ExpressError(400, "Review rating must be between 1 and 5");
    }

    next();
};

// Middleware: only allow review if user has a completed, paid booking for this listing
const requireVerifiedStay = wrapAsync(async (req, res, next) => {
    const listing = res.locals.listing;
    const userId = req.user._id;
    const now = new Date();

    // Check for a paid booking that has already checked out
    const completedBooking = await Booking.findOne({
        listing: listing._id,
        user: userId,
        paid: true,
        checkOut: { $lt: now },
    });

    if (!completedBooking) {
        req.flash("error", "You can only review a listing after completing a paid stay.");
        return res.redirect(`/listings/${listing._id}`);
    }

    // Prevent duplicate reviews: one review per booking
    const alreadyReviewed = await Review.findOne({
        author: userId,
        _id: { $in: listing.reviews },
    });

    if (alreadyReviewed) {
        req.flash("error", "You have already reviewed this listing.");
        return res.redirect(`/listings/${listing._id}`);
    }

    next();
});

router.post("/", isLoggedIn, requireVerifiedStay, validateReview, wrapAsync(async (req, res) => {
    const listing = res.locals.listing;
    const review = new Review(req.body.review);
    review.author = req.user._id;

    listing.reviews.push(review);

    await review.save();
    await listing.save();

    req.flash("success", "Review submitted successfully!");
    res.redirect(`/listings/${listing._id}`);
}));

router.delete("/:reviewId", isLoggedIn, wrapAsync(async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);
    
    // Allow if user is author OR admin
    if (review && (review.author.equals(req.user._id) || req.user.role === 'admin')) {
        await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
        await Review.findByIdAndDelete(reviewId);
        req.flash("success", "Review deleted successfully.");
        return res.redirect(`/listings/${id}`);
    }
    
    req.flash("error", "You do not have permission to delete this review.");
    res.redirect(`/listings/${id}`);
}));

module.exports = router;