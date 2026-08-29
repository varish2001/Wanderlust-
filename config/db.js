const mongoose = require("mongoose");
const env = require("./env");

async function connectDb(dbUrl) {
    mongoose.connection.on("error", (error) => {
        console.error("Mongoose connection error:", error);
    });

    mongoose.connection.once("open", () => {
        console.log("Mongoose connected to DB");
    });

    try {
        await mongoose.connect(dbUrl);
        console.log(`Connected to DB: ${dbUrl}`);
    } catch (error) {
        if (!env.isProduction && dbUrl !== env.localDbUrl) {
            console.warn(`Primary DB unavailable. Falling back to local MongoDB at ${env.localDbUrl}.`);
            await mongoose.connect(env.localDbUrl);
            console.log(`Connected to DB: ${env.localDbUrl}`);
            return;
        }

        throw error;
    }
}

module.exports = connectDb;
