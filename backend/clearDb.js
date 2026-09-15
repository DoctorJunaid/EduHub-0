import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const clear = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await mongoose.connection.collection('institutes').deleteMany({});
  await mongoose.connection.collection('campuses').deleteMany({});
  console.log('Cleared mock data');
  process.exit(0);
};
clear();
