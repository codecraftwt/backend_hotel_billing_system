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
        // You can set a default value for img if needed
    },
    type: {
        type: String,
        default: null,
    },
    shortcode: {
        type: String,
        // You can set a default value or add validation if needed
        default: null,
    }
});

const FoodItem = mongoose.model('FoodItem', FoodItems);
export default FoodItem;
