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
    console.log(req.body,'req.body');
    console.log(req.file,'req.file');
    
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
export const updateFoodItem = async (req, res) => {
    const { id } = req.params;  // Get food item ID from the URL
    const { name, category, price, type, shortcode } = req.body;  // Get the updated details from the body
    const image = req.file;  // Get the new image file if uploaded
    console.log(req.params,'req.params');
    console.log(req.body,'req.body');
    console.log(image,'image');
    
    
    try {
        // Find the food item to update by ID
        const foodItem = await FoodItem.findById(id);

        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        // If category is provided, check if it exists in the database
        if (category) {
            const categoryDoc = await FoodCategory.findById(category);
            if (!categoryDoc) {
                return res.status(400).json({ message: 'Category not found' });
            }
            foodItem.category = categoryDoc._id;  // Update category if valid
        }

        // Update the fields of the food item
        if (name) foodItem.name = name;
        if (price) foodItem.price = price;
        if (type) foodItem.type = type;
        if (shortcode) foodItem.shortcode = shortcode;

        // If a new image is provided, upload it to Cloudinary
        if (image) {
            const result = await cloudinary.uploader.upload(image.path);
            foodItem.img = result.secure_url;  // Update image URL
        }

        // Save the updated food item
        await foodItem.save();

        // Optionally, emit the updated food item to clients (via socket.io)
        if (req.io) {
            const updatedFoodItems = await FoodItem.find();
            req.io.emit('updatedFoodItem', updatedFoodItems);
        }

        // Return the updated food item or all items (if needed)
        res.status(200).json(foodItem); // You can also return the list of all food items if preferred
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
