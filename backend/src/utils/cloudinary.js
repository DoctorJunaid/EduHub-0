import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a buffer to Cloudinary.
 * Returns the secure URL of the uploaded image.
 * Throws a descriptive error on failure (including 403 auth issues).
 */
export const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "eduhub/institutes",
        resource_type: "image",
        transformation: [{ width: 400, height: 400, crop: "limit", quality: "auto" }],
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          if (error.http_code === 403) {
            reject(new Error("Image upload failed: Invalid Cloudinary credentials (403). Check your API Key and Secret."));
          } else {
            reject(new Error(`Image upload failed: ${error.message || "Unknown error"}`));
          }
        } else {
          resolve(result.secure_url);
        }
      }
    );

    const readable = new Readable();
    readable._read = () => {};
    readable.push(buffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export default cloudinary;
