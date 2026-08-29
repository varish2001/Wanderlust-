const path = require("path");

require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const isProduction = process.env.NODE_ENV === "production";
const localDbUrl = "mongodb://127.0.0.1:27017/wanderlust";
const requireEnv = (name) => {
    const value = process.env[name]?.trim();

    if (isProduction && !value) {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
};

const atlasDbUrl = requireEnv("ATLASDB_URL");
const sessionSecret = requireEnv("SESSION_SECRET") || "wanderlust-dev-secret";

module.exports = {
    isProduction,
    port: Number(process.env.PORT) || 8080,
    localDbUrl,
    dbUrl: atlasDbUrl || localDbUrl,
    sessionSecret,
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
};
