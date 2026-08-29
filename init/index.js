const mongoose = require('mongoose');
const initData = require("./data.js");
const Listing = require("../models/listing.js");
const env = require("../config/env");

const categories = ["Trending", "Beach", "Cabin", "City", "Luxury", "Mountain", "Nature", "Budget"];

main().then( () => {
    console.log("Connected to DB");
})

.catch((err) => {
    console.log(err);
});

async function main(){
    await mongoose.connect(env.dbUrl);
};

const initDB = async () => {
    await Listing.deleteMany({}); 
    const formattedListings = initData.data.map((listing, index) => ({
        ...listing,
        category: categories[index % categories.length],
        images: [{ url: listing.image, filename: "seed-image" }],
    }));
    await Listing.insertMany(formattedListings);
    console.log("data was initialized");

};
initDB().then(() => {
    mongoose.connection.close();
}).catch((err) => {
    console.log(err);
    mongoose.connection.close();
});
