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
    const { name } = req.body; 
    try {
        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Invalid name' });
        }

        const newCategory = new FoodCategory({ name });

        await FoodCategory.insertMany([newCategory]);

        // Retrieve updated categories from the database
        const updatedFoodCategory = await FoodCategory.find();

        req.io.emit('newCategory', updatedFoodCategory);

        res.status(201).json(updatedFoodCategory);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};