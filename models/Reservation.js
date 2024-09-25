import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  reservationName: { type: String, required: true },
  numberOfPeople: { type: Number, required: true },
  tableNumber: { type: Number, required: true },
  userPhoneNumber: { type: String, required: true },
  reservationDateTime: { type: Date, required: true },
  reservationStatus: { type: String, enum: ['processing', 'completed'], default: 'processing' },
});

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
