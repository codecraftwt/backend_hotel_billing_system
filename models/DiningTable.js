import mongoose from 'mongoose';

// Import the Order model
// import Order from './path-to-order-model.js';
import Order from './Order.js';

const DiningTableSchema = new mongoose.Schema({
  tableNumber: { type: Number, required: true, unique: true },
  capacity: { type: Number, required: true },
  status: {
    type: String,
    enum: ['blank table', 'reserved table', 'KOT table'],
    default: 'blank table'
  },
  order: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Order',
    default: null 
  }
});

const DiningTable = mongoose.model('DiningTable', DiningTableSchema);

export default DiningTable;
