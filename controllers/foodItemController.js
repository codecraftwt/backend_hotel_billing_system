import cloudinary from "../config/cloudinary.js";
import FoodCategory from "../models/FoodCategory.js";
import FoodItem from "../models/FoodItem.js";

export const getAllFoodItems = async (req, res) => {
    try {
        const foodItems = await FoodItem.find()
            .populate('category', 'name') // Populate category field with its name
            .exec();

        res.json(foodItems);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getFoodItemsByCategoryId = async (req, res) => {
    const { id } = req.params;
    // console.log(id ,'categoryId');

    try {
        const foodItems = await FoodItem.find({ category: id });

        // If no food items are found, return an empty array
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
    const image = req.file; // Assuming the image field name is 'image'
    console.log(category, 'category');

    try {
        // Find the category by name
        const categoryDoc = await FoodCategory.findOne({ _id: category });
        if (!categoryDoc) {
            return res.status(400).json({ message: 'Category not found' });
        }

        // Upload the image to Cloudinary if provided
        let imgUrl = null;
        if (image) {
            const result = await cloudinary.uploader.upload(image.path);
            imgUrl = result.secure_url;
        }

        // Create the new food item using the category ID and image URL
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

        // Emit the new food item to all connected clients
        if (req.io) {
            req.io.emit('newFoodItem', updatedFoodItems);
        }

        res.status(201).json(updatedFoodItems);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
