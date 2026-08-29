const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    comment: {
        type: String,
        required: true,
        trim: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    listing: {
        type: Schema.Types.ObjectId,
        ref: "Listing",
    },
    createdAt: {
        type : Date,
        default : Date.now(),
    }
});

module.exports = mongoose.model("Review", reviewSchema);
