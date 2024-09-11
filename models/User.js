import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  faceDescriptor: { type: [Number], required: true },
  checkInTime: { type: Date, default: null },
  status: { type: String, enum: ['on duty', 'off duty'], default: 'off duty' },
  checkOutTime: { type: Date, default: null },
});

const User = mongoose.model('User', userSchema);

export default User;
