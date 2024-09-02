import mongoose from "mongoose";
const FoodItems=new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FoodCategory',
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
})

const FoodItem=mongoose.model('FoodItem',FoodItems)
export default FoodItem