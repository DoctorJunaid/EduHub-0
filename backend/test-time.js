import https from 'https';

https.get('https://api.cloudinary.com/v1_1/dgj7wvocx/ping', (res) => {
  console.log("Cloudinary Date Header:", res.headers.date);
  const realTime = Math.floor(new Date(res.headers.date).getTime() / 1000);
  console.log("Real Unix Timestamp:", realTime);
  process.exit(0);
}).on('error', err => {
  console.log('Error:', err.message);
});
