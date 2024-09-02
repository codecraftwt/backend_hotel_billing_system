import FoodCategory from "../models/FoodCategory.js";

export const getAllCategories = async (req, res) => {
    try {
        const categories = await FoodCategory.find();
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const createCategory = async (req, res) => {
    const { name } = req.body;  // Extract name from the request body
    try {
        // Ensure that the name is a string and properly format it
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Invalid name' });
        }

        // Create a new category object
        const newCategory = new FoodCategory({ name });

        // Use insertMany() to insert the new category into the database
        await FoodCategory.insertMany([newCategory]); // Insert as an array with one object

        // Retrieve updated categories from the database
        const updatedFoodCategory = await FoodCategory.find();

        // Emit the new category to all connected clients
        req.io.emit('newCategory', updatedFoodCategory);

        // Send the updated list of categories in the response
        res.status(201).json(updatedFoodCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};