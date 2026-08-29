const express = require('express');
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js");
const listingController = require("../controllers/listings");
const {
    isLoggedIn,
    validateListing,
    isListingOwner,
    isValidObjectId,
} = require("../middleware.js");
const { upload } = require("../config/cloudinary");


//index route
router.get("/", wrapAsync(listingController.index));

//new route
router.get("/new", isLoggedIn, listingController.renderNewForm);

//show route
router.get("/:id", isValidObjectId("id"), wrapAsync(listingController.showListing));

//create route

router.post(
    "/",
    isLoggedIn,
    upload.array("images", 6),
    validateListing,
    wrapAsync(listingController.createListing)
);

//Edit Route
router.get(
    "/:id/edit", 
    isLoggedIn,
    isValidObjectId("id"),
    isListingOwner,
    wrapAsync(listingController.renderEditForm)
);

//Update Route
router.put("/:id",
    isLoggedIn,
    isValidObjectId("id"),
    isListingOwner,
    upload.array("images", 6),
    validateListing,
    wrapAsync(listingController.updateListing)
);

//Delete Route
router.delete("/:id", isLoggedIn, isValidObjectId("id"), isListingOwner, wrapAsync(listingController.deleteListing));

router.post("/:id/favorite", isLoggedIn, isValidObjectId("id"), wrapAsync(listingController.toggleFavorite));

module.exports = router;
