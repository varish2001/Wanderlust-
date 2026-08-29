const mongoose = require("mongoose");
const { listingSchema, reviewSchema, userSchema, loginSchema } = require("./schema");
const ExpressError = require("./utils/ExpressError");
const Listing = require("./models/listing");
const Review = require("./models/review");

const validate = (schema, source = "body") => (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (!error) {
        return next();
    }

    const message = error.details.map((item) => item.message).join(", ");
    next(new ExpressError(400, message));
};

module.exports.validateListing = validate(listingSchema);
module.exports.validateReview = validate(reviewSchema);
module.exports.validateSignup = validate(userSchema);
module.exports.validateLogin = validate(loginSchema);

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl;
        req.flash("error", "You must be signed in first.");
        return res.redirect("/login");
    }

    next();
};

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
        delete req.session.returnTo;
    }

    next();
};

module.exports.isValidObjectId = (paramName = "id") => (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params[paramName])) {
        return next(new ExpressError(400, "Invalid resource identifier."));
    }
    next();
};

module.exports.isListingOwner = async (req, res, next) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    if (!listing.owner) {
        return next();
    }

    if (!req.user || !listing.owner.equals(req.user._id)) {
        req.flash("error", "You do not have permission to manage this listing.");
        return res.redirect(`/listings/${listing._id}`);
    }

    next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
        req.flash("error", "Review not found.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    if (!review.author || !req.user || !review.author.equals(req.user._id)) {
        req.flash("error", "You can only delete your own reviews.");
        return res.redirect(`/listings/${req.params.id}`);
    }

    next();
};
