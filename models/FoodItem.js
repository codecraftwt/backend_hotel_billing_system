import mongoose from 'mongoose';

const FoodItems = new mongoose.Schema({
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
    img: {
        type: String,
    },
    type: {
        type: String,
        default: null,
    },
    shortcode: {
        type: String,
        default: null,
    }
});

const FoodItem = mongoose.model('FoodItem', FoodItems);
export default FoodItem;
