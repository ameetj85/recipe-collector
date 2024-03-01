import mongoose from 'mongoose';

let connected = false;

const connectDB = async () => {
  mongoose.set('strictQuery', true);

  // if db is already connected dont reconnect
  if (connected) {
    console.log('Mongo DB is already connected.');
    return;
  }

  // connect to Mongo DB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    connected = true;
    console.log('Mongo DB connected.');
  } catch (error) {
    console.log(error);
  }
};

export default connectDB;
