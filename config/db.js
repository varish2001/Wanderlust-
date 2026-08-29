const mongoose = require("mongoose");
const env = require("./env");

let connectPromise;
let connectionListenersRegistered = false;

async function connectDb(dbUrl) {
    if (mongoose.connection.readyState === 1) {
        return mongoose.connection;
    }

    if (mongoose.connection.readyState === 2 && connectPromise) {
        return connectPromise;
    }

    if (!connectionListenersRegistered) {
        mongoose.connection.on("error", (error) => {
            console.error("Mongoose connection error:", error);
        });

        mongoose.connection.once("open", () => {
            console.log("Mongoose connected to DB");
        });

        connectionListenersRegistered = true;
    }

    connectPromise = mongoose.connect(dbUrl)
        .then(() => {
            console.log(`Connected to DB: ${dbUrl}`);
            return mongoose.connection;
        })
        .catch(async (error) => {
            if (!env.isProduction && dbUrl !== env.localDbUrl) {
                console.warn(`Primary DB unavailable. Falling back to local MongoDB at ${env.localDbUrl}.`);
                await mongoose.connect(env.localDbUrl);
                console.log(`Connected to DB: ${env.localDbUrl}`);
                return mongoose.connection;
            }

            throw error;
        })
        .finally(() => {
            if (mongoose.connection.readyState !== 2) {
                connectPromise = undefined;
            }
        });

    return connectPromise;
}

module.exports = connectDb;
