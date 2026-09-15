import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

const uploadStream = cloudinary.uploader.upload_stream(
  { 
    resource_type: 'auto',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME 
  },
  (error, result) => {
    if (error) {
      console.error('Upload Error:', error);
    } else {
      console.log('Upload Success:', result.secure_url);
    }
  }
);
uploadStream.end(Buffer.from('hello world image content'));
