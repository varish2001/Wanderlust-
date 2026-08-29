const mongoose = require('mongoose');
const Review = require("./review.js");
const Schema = mongoose.Schema;

const imageSchema = new Schema(
    {
        url: String,
        filename: String,
    },
    { _id: false }
);

const listingSchema = new Schema({
    title: {
        type:String,
        required : true,
        trim: true,
    },
    description: {
        type: String,
        required: true,
        trim: true,
    },
    image: {
        type: String,
        default : "https://images.unsplash.com/photo-1769648141418-4de05799b3cf?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        set: (v) => v === "" ? "https://images.unsplash.com/photo-1769648141418-4de05799b3cf?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" : v,
    },
    images: {
        type: [imageSchema],
        default: [],
    },
    price: {
        type: Number,
        min: 0,
        required: true,
    },
    location: {
        type: String,
        required: true,
        trim: true,
    },
    country: {
        type: String,
        required: true,
        trim: true,
    },
    category: {
        type: String,
        enum: ["Trending", "Beach", "Cabin", "City", "Luxury", "Mountain", "Nature", "Budget"],
        default: "Trending",
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: "Review",

        }
    ],
    favoritedBy: [
        {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    reviewCount: {
        type: Number,
        default: 0,
    },
    viewCount: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

listingSchema.virtual("heroImage").get(function heroImage() {
    return this.images?.[0]?.url || this.image;
});

listingSchema.index({ title: "text", location: "text", country: "text" });
listingSchema.index({ category: 1, price: 1, createdAt: -1 });

listingSchema.post("findOneAndDelete", async (listing) => {
    if (listing) {
        await Review.deleteMany({ _id: { $in: listing.reviews } });
    }
});

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
