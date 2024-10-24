import mongoose from 'mongoose';

const timesheetSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  checkInTime: { type: Date, default: null },
  checkOutTime: { type: Date, default: null },
  status: { type: String, enum: ['on duty', 'off duty'], default: 'off duty' },
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  usePass: { type: String, required: true },
  role: { type: [String], enum: ['admin', 'kds','counter'], default: ['kds']},
  timesheet: [timesheetSchema],
});

const User = mongoose.model('User', userSchema);

export default User;