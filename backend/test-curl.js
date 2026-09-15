import crypto from 'crypto';

const timestamp = Math.round(new Date().getTime() / 1000);
const api_secret = 'Glng5r382eWjBhbT-qPJOWqLE_c';
const api_key = '199292632956784';
const cloud_name = 'dgj7wvocx';

// String to sign
const str = `timestamp=${timestamp}${api_secret}`;
const signature = crypto.createHash('sha1').update(str).digest('hex');

const form = new FormData();
form.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==');
form.append('api_key', api_key);
form.append('timestamp', timestamp);
form.append('signature', signature);

fetch(`https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`, {
  method: 'POST',
  body: form
})
.then(res => res.text())
.then(text => console.log("Response:", text))
.catch(err => console.error("Error:", err));
