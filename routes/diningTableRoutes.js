import express from 'express';
import {getDiningTables, updateTables, updateTableWithOrder } from '../controllers/diningTableController.js';
import { createCategory, getAllCategories } from '../controllers/foodCategoryController.js';
import { createFoodItem, getAllFoodItems, getFoodItemsByCategoryId } from '../controllers/foodItemController.js';
import { addCustomerName, createOrUpdateOrder, deleteFoodItem, getAllOrders, getAllOrdersAdmin, getOrderByTableNo, updateDiscountPercent, updateFoodItemQuantity, updateFoodItemStatus, updateOrderStatus, updatePaymentType } from '../controllers/orderController.js';
import { createOrUpdateStatus, getStatusByTableNo } from '../controllers/statusController.js';
import upload from '../config/multer.js';
const router = express.Router();

// Route to create multiple dining tables
router.post('/dining-tables', updateTables);

// Route to get all dining tables
router.get('/dining-tables', getDiningTables);
router.put('/tables/:tableNumber', updateTableWithOrder);

router.get('/foodCategory',getAllCategories)
router.post('/foodCategory',createCategory)

router.get('/foodItems',getAllFoodItems)
router.get('/foodItems/:id',getFoodItemsByCategoryId)
router.post('/foodItems',upload.single('image'),createFoodItem)


router.post('/orders', createOrUpdateOrder);
router.get('/orders/:tableNo', getOrderByTableNo);
router.put('/updateFoodItemQuantity', updateFoodItemQuantity);
router.put('/deleteFoodItem', deleteFoodItem);
// New routes for discount and payment type
router.patch('/update-discount', updateDiscountPercent);
router.patch('/add-customer-name', addCustomerName);
router.patch('/update-payment-type', updatePaymentType);
router.patch('/orders/updateStatus', updateOrderStatus);


router.put('/status', createOrUpdateStatus);
router.get('/status/:tableNo', getStatusByTableNo);

router.get('/getAllOrders', getAllOrders);
router.get('/getAllOrdersAdmin', getAllOrdersAdmin);
router.put('/updateFoodItemStatus', updateFoodItemStatus);

export default router;
