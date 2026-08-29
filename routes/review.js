const express = require('express');
const router = express.Router({mergeParams: true});
const wrapAsync = require("../utils/wrapAsync.js");
const reviewController = require("../controllers/reviews");
const {
    isLoggedIn,
    validateReview,
    isReviewAuthor,
    isValidObjectId,
} = require("../middlewares.js");


//Reviews 
//post route for reviews
router.post("/", isLoggedIn, isValidObjectId("id"), validateReview, wrapAsync(reviewController.createReview));

//Delete review route
router.delete("/:reviewId", isLoggedIn, isValidObjectId("id"), isValidObjectId("reviewId"), isReviewAuthor, wrapAsync(reviewController.deleteReview));

module.exports = router;
