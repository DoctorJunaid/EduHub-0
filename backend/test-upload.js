import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import https from 'https';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

https.get('https://worldtimeapi.org/api/timezone/Etc/UTC', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const realTime = JSON.parse(data).unixtime;
    console.log("Real timestamp:", realTime);
    
    // Test an upload stream with fake data
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: 'eduhub_institutes', timestamp: realTime },
      (error, result) => {
        if (error) {
          console.error('Upload Error:', error);
        } else {
          console.log('Upload Success:', result.secure_url);
        }
      }
    );
    uploadStream.end(Buffer.from('hello world'));
  });
}).on('error', err => {
  console.log('Error fetching time:', err.message);
});
