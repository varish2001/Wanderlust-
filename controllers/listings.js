const mongoose = require("mongoose");
const Listing = require("../models/listing");
const Review = require("../models/review");
const User = require("../models/user");

const PAGE_SIZE = 9;

const buildSearchQuery = (searchTerm) => {
    if (!searchTerm?.trim()) {
        return {};
    }

    const keyword = searchTerm.trim();
    return {
        $or: [
            { title: { $regex: keyword, $options: "i" } },
            { location: { $regex: keyword, $options: "i" } },
            { country: { $regex: keyword, $options: "i" } },
        ],
    };
};

const buildFilterQuery = ({ search, category, maxPrice, popular }) => {
    const query = buildSearchQuery(search);

    if (category?.trim()) {
        query.category = category.trim();
    }

    if (maxPrice) {
        query.price = { $lte: Number(maxPrice) || 0 };
    }

    if (popular === "true") {
        query.reviewCount = { $gte: 2 };
    }

    return query;
};

const getImageList = (req) => {
    const currentImage = req.body.listing?.image?.trim();
    const galleryImages = (req.body.listing?.imageGallery || "")
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean);

    const uploadedImages = (req.files || [])
        .filter((file) => file.path)
        .map((file) => ({
            url: file.path,
            filename: file.filename || file.originalname,
        }));

    const urlImages = [currentImage, ...galleryImages]
        .filter(Boolean)
        .map((url) => ({ url, filename: "external-image" }));

    return [...uploadedImages, ...urlImages];
};

module.exports.home = async (req, res) => {
    const [featuredListings, recentListings, listingStats] = await Promise.all([
        Listing.find({})
            .sort({ reviewCount: -1, viewCount: -1, createdAt: -1 })
            .limit(6)
            .populate("owner", "username"),
        Listing.find({})
            .sort({ createdAt: -1 })
            .limit(4)
            .populate("owner", "username"),
        Listing.aggregate([
            {
                $group: {
                    _id: null,
                    totalListings: { $sum: 1 },
                    totalReviews: { $sum: "$reviewCount" },
                    averagePrice: { $avg: "$price" },
                },
            },
        ]),
    ]);

    const stats = listingStats[0] || {
        totalListings: 0,
        totalReviews: 0,
        averagePrice: 0,
    };

    res.render("home", {
        featuredListings,
        recentListings,
        stats,
        pageTitle: "WanderLust | Book standout stays around the world",
        pageDescription:
            "Discover curated homes, modern stays, and memorable getaways with WanderLust.",
    });
};

module.exports.index = async (req, res) => {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const filters = {
        search: req.query.search || "",
        category: req.query.category || "",
        maxPrice: req.query.maxPrice || "",
        popular: req.query.popular || "",
    };

    const aggregateFilters = [];
    const searchQuery = buildSearchQuery(filters.search);

    if (Object.keys(searchQuery).length) {
        aggregateFilters.push({ $match: searchQuery });
    }

    aggregateFilters.push({
        $addFields: {
            reviewCount: { $size: { $ifNull: ["$reviews", []] } },
        },
    });

    if (filters.category) {
        aggregateFilters.push({ $match: { category: filters.category } });
    }

    if (filters.maxPrice) {
        aggregateFilters.push({ $match: { price: { $lte: Number(filters.maxPrice) || 0 } } });
    }

    if (filters.popular === "true") {
        aggregateFilters.push({ $match: { reviewCount: { $gte: 2 } } });
    }

    const [aggregatedListings, totalListings, categories, statsData] = await Promise.all([
        Listing.aggregate([
            ...aggregateFilters,
            { $sort: { createdAt: -1 } },
            { $skip: (page - 1) * PAGE_SIZE },
            { $limit: PAGE_SIZE },
        ]),
        Listing.aggregate([
            ...aggregateFilters,
            { $count: "count" },
        ]),
        Listing.distinct("category"),
        Listing.aggregate([
            {
                $group: {
                    _id: null,
                    totalListings: { $sum: 1 },
                    totalReviews: { $sum: "$reviewCount" },
                    mostPopularScore: { $max: "$reviewCount" },
                },
            },
        ]),
    ]);

    const listings = await Listing.populate(aggregatedListings, {
        path: "owner",
        select: "username",
    });

    const totalPages = Math.max(Math.ceil((totalListings[0]?.count || 0) / PAGE_SIZE), 1);
    const stats = statsData[0] || {
        totalListings: 0,
        totalReviews: 0,
        mostPopularScore: 0,
    };

    res.render("listings/index", {
        allListings: listings,
        filters,
        categories: categories.filter(Boolean),
        currentPage: page,
        totalPages,
        stats,
        pageTitle: "Browse Listings | WanderLust",
        pageDescription: "Search and filter WanderLust stays by location, title, category, and budget.",
    });
};

module.exports.renderNewForm = (req, res) => {
    res.render("listings/new", {
        pageTitle: "Create Listing | WanderLust",
        pageDescription: "Share a new stay on WanderLust.",
    });
};

module.exports.showListing = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("error", "Invalid listing id.");
        return res.redirect("/listings");
    }

    const listing = await Listing.findById(id)
        .populate("owner", "username")
        .populate({
            path: "reviews",
            populate: { path: "author", select: "username" },
            options: { sort: { createdAt: -1 } },
        });

    if (!listing) {
        req.flash("error", "Listing you requested does not exist.");
        return res.redirect("/listings");
    }

    await Listing.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
    listing.viewCount += 1;

    res.render("listings/show", {
        listing,
        isFavorite: Boolean(
            req.user && listing.favoritedBy.some((userId) => userId.equals(req.user._id))
        ),
        pageTitle: `${listing.title} | WanderLust`,
        pageDescription: listing.description,
    });
};

module.exports.createListing = async (req, res) => {
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.images = getImageList(req);

    if (newListing.images.length) {
        newListing.image = newListing.images[0].url;
    }

    await newListing.save();
    req.flash("success", "Listing created successfully.");
    res.status(201).redirect(`/listings/${newListing._id}`);
};

module.exports.renderEditForm = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested does not exist.");
        return res.redirect("/listings");
    }

    res.render("listings/edit", {
        listing,
        pageTitle: `Edit ${listing.title} | WanderLust`,
        pageDescription: "Update your listing details on WanderLust.",
    });
};

module.exports.updateListing = async (req, res) => {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
        req.flash("error", "Listing you requested does not exist.");
        return res.redirect("/listings");
    }

    Object.assign(listing, req.body.listing);

    const imageList = getImageList(req);
    if (imageList.length) {
        listing.images = imageList;
        listing.image = imageList[0].url;
    }

    if (!listing.owner && req.user) {
        listing.owner = req.user._id;
    }

    await listing.save();
    req.flash("success", "Listing updated successfully.");
    res.redirect(`/listings/${id}`);
};

module.exports.deleteListing = async (req, res) => {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("success", "Listing deleted successfully.");
    res.redirect("/listings");
};

module.exports.toggleFavorite = async (req, res) => {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
        req.flash("error", "Listing not found.");
        return res.redirect("/listings");
    }

    const userId = req.user._id;
    const alreadyFavorite = listing.favoritedBy.some((id) => id.equals(userId));

    if (alreadyFavorite) {
        listing.favoritedBy.pull(userId);
        await User.findByIdAndUpdate(userId, { $pull: { savedListings: listing._id } });
        req.flash("success", "Removed from wishlist.");
    } else {
        listing.favoritedBy.addToSet(userId);
        await User.findByIdAndUpdate(userId, { $addToSet: { savedListings: listing._id } });
        req.flash("success", "Added to wishlist.");
    }

    await listing.save();
    res.redirect(`/listings/${listing._id}`);
};

module.exports.dashboard = async (req, res) => {
    const [myListings, myReviews, savedListings, totals] = await Promise.all([
        Listing.find({ owner: req.user._id }).sort({ createdAt: -1 }),
        Review.find({ author: req.user._id }).sort({ createdAt: -1 }).populate("listing", "title"),
        Listing.find({ favoritedBy: req.user._id }).sort({ createdAt: -1 }),
        Promise.all([
            Listing.countDocuments({ owner: req.user._id }),
            Review.countDocuments({ author: req.user._id }),
        ]),
    ]);

    res.render("users/dashboard", {
        myListings,
        myReviews,
        savedListings,
        stats: {
            totalListings: totals[0],
            totalReviews: totals[1],
            savedCount: savedListings.length,
        },
        pageTitle: "Dashboard | WanderLust",
        pageDescription: "Manage your listings, reviews, and saved stays.",
    });
};
