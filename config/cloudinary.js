const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const env = require("./env");

const hasCloudinaryConfig = Boolean(
    env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
);

if (hasCloudinaryConfig) {
    cloudinary.config({
        cloud_name: env.cloudinaryCloudName,
        api_key: env.cloudinaryApiKey,
        api_secret: env.cloudinaryApiSecret,
    });
}

const storage = hasCloudinaryConfig
    ? new CloudinaryStorage({
          cloudinary,
          params: {
              folder: "wanderlust-dev",
              allowed_formats: ["jpg", "jpeg", "png", "webp"],
          },
      })
    : multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024, files: 6 },
});

module.exports = { cloudinary, upload, hasCloudinaryConfig };
