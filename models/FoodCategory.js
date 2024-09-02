import mongoose from "mongoose";
const FoodCategorySchema=new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
})

const FoodCategory=mongoose.model('FoodCategory',FoodCategorySchema)
export default FoodCategory