const ExpressError = require("./utils/ExpressError.js");
const Listing = require("./models/listing.js");
const Review = require("./models/review.js");

const validateListing = (template) => {
    return (req, res, next) => {
        const listing = new Listing(req.body.listing);
        const error = listing.validateSync();

        if (error) {
            const listingData = {
                ...req.body.listing,
                image: req.body.listing?.image || { url: "" },
                _id: req.params.id,
            };

            return res.status(400).render(template, {
                listing: listingData,
                error,
            });
        }

        next();
    };
};

const loadListing = async (req, res, next) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }

    res.locals.listing = listing;
    next();
};

module.exports = {
    validateListing,
    loadListing,
    isLoggedIn: (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            req.flash('error', 'You must be signed in first');
            return res.redirect('/auth/login');
        }
        next();
    }
    ,
    isListingAuthor: async (req, res, next) => {
        const { id } = req.params;
        const listing = await Listing.findById(id);
        if (!listing) {
            req.flash('error', 'Listing not found');
            return res.redirect('/listings');
        }
        if (!req.user || !listing.author || !listing.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to do that');
            return res.redirect(`/listings/${id}`);
        }
        next();
    },
    isReviewAuthor: async (req, res, next) => {
        const { reviewId, id } = req.params;
        const review = await Review.findById(reviewId);
        if (!review) {
            req.flash('error', 'Review not found');
            return res.redirect(`/listings/${id}`);
        }
        if (!req.user || !review.author || !review.author.equals(req.user._id)) {
            req.flash('error', 'You do not have permission to do that');
            return res.redirect(`/listings/${id}`);
        }
        next();
    },
    isAdmin: (req, res, next) => {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            req.flash('error', 'You must be signed in first');
            return res.redirect('/auth/login');
        }
        if (req.user.role !== 'admin') {
            req.flash('error', 'Access denied. Indian laws require Admin privileges for this action 🙏');
            return res.redirect('/');
        }
        next();
    }
};