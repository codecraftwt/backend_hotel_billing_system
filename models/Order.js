import mongoose from "mongoose";

const foodItemSchema = new mongoose.Schema({
    foodItemId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'FoodItem' },
    foodItemName: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    itemPrice: { type: Number, required: true },
    img:{type:String,required:true},
    quantityWithPrice: { type: Number, default: function() { return this.quantity * this.itemPrice; } },
    status: { type: String, default: 'on hold', enum: ['on hold', 'working', 'ready'] },
    type:{ type: String,default: null},
    orderNote: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now } 
});

const orderSchema = new mongoose.Schema({
    tableNo: { type: Number, required: true },
    customerName: { type: String, default:null },
    customerNo: { type: Number, default:null },
    ordersList: [foodItemSchema],
    totalPrice: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 }, // New field for discount percentage
    afterDiscountPrice: { type: Number, default: 0 }, // New field for price after discount
    paymentType: { type: String, default: null }, // New field for payment type
    orderStatus: { type: String, default: 'processing', enum: ['processing', 'completed'] }, // New field
    kotStatus: { type: String, default: null, enum: ['null', 'confirmed'] } // Added kotStatus field
},{ timestamps: true });

// Calculate total price before saving
orderSchema.pre('save', function(next) {
    this.totalPrice = this.ordersList.reduce((total, item) => total + item.quantityWithPrice, 0);
    this.afterDiscountPrice = this.totalPrice - (this.totalPrice * (this.discountPercent / 100));
    next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
