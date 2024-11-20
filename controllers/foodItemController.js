import cloudinary from "../config/cloudinary.js";
import FoodCategory from "../models/FoodCategory.js";
import FoodItem from "../models/FoodItem.js";

export const getAllFoodItems = async (req, res) => {
    try {
        const foodItems = await FoodItem.find()
            .populate('category', 'name') 
            .exec();

        res.json(foodItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFoodItemsByCategoryId = async (req, res) => {
    const { id } = req.params;

    try {
        const foodItems = await FoodItem.find({ category: id });

        if (!foodItems.length) {
            return res.json([]);
        }

        res.json(foodItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createFoodItem = async (req, res) => {
    const { name, category, price, type, shortcode } = req.body;
    const image = req.file; 

    try {
        const categoryDoc = await FoodCategory.findOne({ _id: category });
        if (!categoryDoc) {
            return res.status(400).json({ message: 'Category not found' });
        }

        let imgUrl = null;
        if (image) {
            const result = await cloudinary.uploader.upload(image.path);
            imgUrl = result.secure_url;
        }

        const newFoodItem = new FoodItem({
            name,
            category: categoryDoc._id,
            price,
            img: imgUrl,
            type,
            shortcode
        });

        await newFoodItem.save();
        const updatedFoodItems = await FoodItem.find();

        if (req.io) {
            req.io.emit('newFoodItem', updatedFoodItems);
        }

        res.status(201).json(updatedFoodItems);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
