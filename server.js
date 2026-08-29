const app = require("./app");
const connectDb = require("./config/db");
const env = require("./config/env");

async function start() {
    try {
        await connectDb(env.dbUrl);
        app.listen(env.port, () => {
            console.log(`Server is listening on port ${env.port}`);
        });
    } catch (error) {
        console.error("Database connection failed:", error);
        process.exit(1);
    }
}

start();
