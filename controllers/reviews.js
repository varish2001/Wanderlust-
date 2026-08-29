const Listing = require("../models/listing");
const Review = require("../models/review");

module.exports.createReview = async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const newReview = new Review(req.body.review);
    newReview.author = req.user._id;
    newReview.listing = listing._id;

    listing.reviews.push(newReview);
    listing.reviewCount = listing.reviews.length;

    await newReview.save();
    await listing.save();

    req.flash("success", "Review added successfully.");
    res.status(201).redirect(`/listings/${listing._id}`);
};

module.exports.deleteReview = async (req, res) => {
    const { id, reviewId } = req.params;

    await Listing.findByIdAndUpdate(id, {
        $pull: { reviews: reviewId },
        $inc: { reviewCount: -1 },
    });
    await Review.findByIdAndDelete(reviewId);

    req.flash("success", "Review deleted successfully.");
    res.redirect(`/listings/${id}`);
};
