import mongoose from 'mongoose';
// const uri=process.env.MONGODB_URI;
// const uri='mongodb://localhost:27017/mydatabase'
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
    // await mongoose.connect('mongodb://localhost:27017/mydatabase', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};

export default connectDB;
