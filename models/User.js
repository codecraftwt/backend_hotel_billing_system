// // import mongoose from 'mongoose';

// // const userSchema = new mongoose.Schema({
// //   username: { type: String, required: true, unique: true },
// //   faceDescriptor: { type: [Number], required: true },
// //   checkInTime: { type: Date, default: null },
// //   status: { type: String, enum: ['on duty', 'off duty'], default: 'off duty' },
// //   checkOutTime: { type: Date, default: null },
// // });

// // const User = mongoose.model('User', userSchema);

// // export default User;


// // models/User.js
// import mongoose from 'mongoose';

// const userSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     imageUrl: { type: String, required: true },
// });

// const User = mongoose.model('User', userSchema);

// export default User;
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
  role: { type: String, enum: ['admin', 'user'], default: 'user' },
  timesheet: [timesheetSchema],
});

const User = mongoose.model('User', userSchema);

export default User;

