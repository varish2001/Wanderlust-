const joi = require("joi");

module.exports.listingSchema = joi.object({
    listing: joi.object({
        title: joi.string().trim().min(4).max(80).required(),
        description: joi.string().trim().min(20).max(1000).required(),
        image: joi.string().allow("", null),
        imageGallery: joi.string().allow("", null),
        location: joi.string().trim().min(2).max(80).required(),
        price: joi.number().required().min(0),
        country: joi.string().trim().min(2).max(80).required(),
        category: joi.string().trim().valid(
            "Trending",
            "Beach",
            "Cabin",
            "City",
            "Luxury",
            "Mountain",
            "Nature",
            "Budget"
        ).required(),
    }).required()
});

module.exports.reviewSchema = joi.object({
    review: joi.object({
        rating: joi.number().required().min(1).max(5),
        comment: joi.string().trim().min(10).max(400).required(),
    }).required()
});

module.exports.userSchema = joi.object({
    username: joi.string().trim().min(3).max(24).required(),
    email: joi.string().email().required(),
    password: joi.string().required().min(6),
});

module.exports.loginSchema = joi.object({
    email: joi.string().trim().required(),
    password: joi.string().required().min(6),
});
