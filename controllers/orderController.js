import moment from "moment";
import FoodItem from "../models/FoodItem.js";
import Order from "../models/Order.js";

// export const createOrUpdateOrder = async (req, res) => {
//     const { tableNo, foodItemId } = req.body;

//     try {
//         // Fetch the food item to ensure it exists
//         const foodItem = await FoodItem.findById(foodItemId);
//         if (!foodItem) {
//             return res.status(404).json({ message: 'Food item not found' });
//         }

//         const { name: foodItemName, price: itemPrice,img:img ,type:type} = foodItem;
//         const quantity = 1;

//         // Fetch the existing order for the given table number and status 'processing'
//         let order = await Order.findOne({ tableNo, orderStatus:'processing' });

//         if (order) {
//             // Find the index of the food item in the order
//             const existingItemIndex = order.ordersList.findIndex(item => item.foodItemId.toString() === foodItemId);

//             if (existingItemIndex >= 0) {
//                 // Update quantity and price for existing food item
//                 order.ordersList[existingItemIndex].quantity += quantity;
//                 order.ordersList[existingItemIndex].quantityWithPrice = order.ordersList[existingItemIndex].quantity * order.ordersList[existingItemIndex].itemPrice;
//                 order.ordersList[existingItemIndex].updatedAt = Date.now(); // Update timestamp
//             } else {
//                 // Add new food item to the order
//                 order.ordersList.push({
//                     foodItemId,
//                     foodItemName,
//                     quantity,
//                     itemPrice,
//                     img,
//                     type,
//                     quantityWithPrice: quantity * itemPrice,
//                     createdAt: Date.now(),
//                     updatedAt: Date.now()
//                 });
//             }

//             // Save the updated order
//             await order.save();
//         } else {
//             // Create a new order if it does not exist
//             const newOrder = new Order({
//                 tableNo,
//                 orderStatus:'processing', // Initialize status to 'processing'
//                 ordersList: [{
//                     foodItemId,
//                     foodItemName,
//                     quantity,
//                     itemPrice,
//                     img,
//                     type,
//                     quantityWithPrice: quantity * itemPrice,
//                     createdAt: Date.now(),
//                     updatedAt: Date.now()
//                 }]
//             });
//             await newOrder.save();
//         }

//         // Fetch and emit the updated order
//         const updatedOrder = await Order.findOne({ tableNo, orderStatus:'processing' });
//         req.io.emit('orderUpdated', updatedOrder);

//         // Return the updated order as a response
//         res.status(200).json(updatedOrder);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

export const createOrUpdateOrder = async (req, res) => {
    const { tableNo, foodItemId } = req.body;
    const currentTime = new Date();
    const bufferTime = 60 * 1000; // 60 seconds in milliseconds

    try {
        // Fetch the food item to ensure it exists
        const foodItem = await FoodItem.findById(foodItemId);
        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        const { name: foodItemName, price: itemPrice, img, type } = foodItem;
        const quantity = 1;

        // Fetch the existing order for the given table number and status 'processing'
        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (order) {
            // Handle confirmed KOT status
            if (order.kotStatus === 'confirmed') {
                // Find all items with the same foodItemId
                const existingItems = order.ordersList.filter(item => item.foodItemId.toString() === foodItemId);

                // Check if any existing item has a createdAt timestamp within the buffer time
                const itemToUpdate = existingItems.find(item => {
                    const existingItemTime = new Date(item.createdAt);
                    return (currentTime - existingItemTime) <= bufferTime;
                });

                if (itemToUpdate) {
                    // Update the quantity and price of the found item within buffer time
                    const itemIndex = order.ordersList.findIndex(item => item._id.toString() === itemToUpdate._id.toString());
                    order.ordersList[itemIndex].quantity += quantity;
                    order.ordersList[itemIndex].quantityWithPrice = order.ordersList[itemIndex].quantity * order.ordersList[itemIndex].itemPrice;
                    order.ordersList[itemIndex].updatedAt = currentTime;
                } else {
                    // Add as new item if none of the existing items are within buffer time
                    order.ordersList.push({
                        foodItemId,
                        foodItemName,
                        quantity,
                        itemPrice,
                        img,
                        type,
                        quantityWithPrice: quantity * itemPrice,
                        createdAt: currentTime,
                        updatedAt: currentTime
                    });
                }

                // Save the updated order
                await order.save();
                const updatedOrder = await Order.findOne({ tableNo, orderStatus: 'processing' });
                req.io.emit('orderUpdated', updatedOrder);
                // Return the updated order as a response
                return res.status(200).json(updatedOrder);

            } else {
                // Handle null KOT status
                const existingItemIndex = order.ordersList.findIndex(item => item.foodItemId.toString() === foodItemId);

                if (existingItemIndex >= 0) {
                    // Update quantity and price for existing food item
                    order.ordersList[existingItemIndex].quantity += quantity;
                    order.ordersList[existingItemIndex].quantityWithPrice = order.ordersList[existingItemIndex].quantity * order.ordersList[existingItemIndex].itemPrice;
                    order.ordersList[existingItemIndex].updatedAt = currentTime; // Update timestamp
                } else {
                    // Add new food item to the order
                    order.ordersList.push({
                        foodItemId,
                        foodItemName,
                        quantity,
                        itemPrice,
                        img,
                        type,
                        quantityWithPrice: quantity * itemPrice,
                        createdAt: currentTime,
                        updatedAt: currentTime
                    });
                }

                // Save the updated order
                await order.save();

                // Fetch and emit the updated order
                const updatedOrder = await Order.findOne({ tableNo, orderStatus: 'processing' });
                req.io.emit('orderUpdated', updatedOrder);

                // Return the updated order as a response
                return res.status(200).json(updatedOrder);
            }
        } else {
            // Create a new order if it does not exist
            const newOrder = new Order({
                tableNo,
                orderStatus: 'processing', // Initialize status to 'processing'
                ordersList: [{
                    foodItemId,
                    foodItemName,
                    quantity,
                    itemPrice,
                    img,
                    type,
                    quantityWithPrice: quantity * itemPrice,
                    createdAt: currentTime,
                    updatedAt: currentTime
                }]
            });
            await newOrder.save();

            // Fetch and emit the new order
            const savedOrder = await Order.findOne({ tableNo, orderStatus: 'processing' });
            req.io.emit('orderUpdated', savedOrder);

            // Return the new order as a response
            return res.status(200).json(savedOrder);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



export const getOrderByTableNo = async (req, res) => {
    const { tableNo } = req.params;
    try {
        // Find the order for the given tableNo and ensure its status is 'processing'
        const order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        // If no order is found, return a 404 status with a message
        if (!order) {
            return res.status(404).json({ message: 'Order not found or not processing' });
        }

        // Return the found order
        res.json(order);
    } catch (error) {
        // Handle any errors that occur during the query
        res.status(500).json({ message: error.message });
    }
};


// export const updateFoodItemQuantity = async (req, res) => {
//     const { tableNo, foodItemId, quantity } = req.body;

//     try {
//         if (quantity <= 0) {
//             return res.status(400).json({ message: 'Quantity must be greater than zero' });
//         }

//         // Find the order for the given tableNo
//         let order = await Order.findOne({ tableNo, orderStatus:'processing' });

//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         // Find the index of the food item in the ordersList
//         const existingItemIndex = order.ordersList.findIndex(item => item.foodItemId.toString() === foodItemId);

//         if (existingItemIndex >= 0) {
//             // Update the quantity and quantityWithPrice
//             order.ordersList[existingItemIndex].quantity = quantity;
//             order.ordersList[existingItemIndex].quantityWithPrice = quantity * order.ordersList[existingItemIndex].itemPrice;
//             order.ordersList[existingItemIndex].updatedAt = Date.now();
//             // Save the updated order
//             await order.save();

//             // Emit the updated order to clients
//             req.io.emit('orderUpdated', order);

//             res.status(200).json(order);
//         } else {
//             res.status(404).json({ message: 'Food item not found in the order' });
//         }
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

export const updateFoodItemQuantity = async (req, res) => {
    const { tableNo, foodItemId, quantity, createdAt } = req.body;

    try {
        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than zero' });
        }

        // Parse createdAt from request body
        const createdAtDate = new Date(createdAt);

        // Find the order for the given tableNo
        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find the index of the food item in the ordersList that matches both foodItemId and createdAt
        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            // Update the quantity and quantityWithPrice
            order.ordersList[existingItemIndex].quantity = quantity;
            order.ordersList[existingItemIndex].quantityWithPrice = quantity * order.ordersList[existingItemIndex].itemPrice;
            order.ordersList[existingItemIndex].updatedAt = Date.now();

            // Save the updated order
            await order.save();

            // Emit the updated order to clients
            req.io.emit('orderUpdated', order);

            // Return the updated item including createdAt
            const updatedItem = {
                ...order.ordersList[existingItemIndex].toObject(), // Convert mongoose document to plain object
                createdAt: order.ordersList[existingItemIndex].createdAt, // Preserve the creation date
                updatedAt: order.ordersList[existingItemIndex].updatedAt // Include the updated date
            };

            res.status(200).json(updatedItem);
        } else {
            res.status(404).json({ message: 'Food item not found in the order' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export const deleteFoodItem = async (req, res) => {
    const { tableNo, foodItemId, createdAt } = req.body;

    try {
        // Find the order for the given tableNo
        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Convert createdAt to Date object
        const createdAtDate = new Date(createdAt);

        // Find the index of the food item in the ordersList that matches both foodItemId and createdAt
        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            // Remove the food item from the ordersList
            order.ordersList.splice(existingItemIndex, 1);

            if (order.ordersList.length === 0) {
                // If the ordersList is empty, delete the entire order
                await order.deleteOne({ tableNo });

                // Emit the deletion to clients
                req.io.emit('orderUpdated', { tableNo });

                return res.status(200).json({ message: 'Order deleted' });
            } else {
                // Save the updated order
                await order.save();

                // Emit the updated order to clients
                req.io.emit('orderUpdated', order);

                return res.status(200).json(order);
            }
        } else {
            return res.status(404).json({ message: 'Food item not found in the order or timestamp mismatch' });
        }
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

// export const updateFoodItemStatus = async (req, res) => {
//     const { tableNo, foodItemId, status } = req.body;

//     if (!['on hold', 'working', 'ready'].includes(status)) {
//         return res.status(400).json({ message: 'Invalid status value' });
//     }

//     try {
//         // Find the order for the given tableNo
//         let order = await Order.findOne({ tableNo, orderStatus:'processing' });

//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         // Find the index of the food item in the ordersList
//         const existingItemIndex = order.ordersList.findIndex(item => item.foodItemId.toString() === foodItemId);

//         if (existingItemIndex >= 0) {
//             // Update the status of the food item
//             order.ordersList[existingItemIndex].status = status;

//             // Save the updated order
//             await order.save();

//             // Emit the updated order to clients
//             req.io.emit('orderUpdated', order);

//             res.status(200).json(order);
//         } else {
//             res.status(404).json({ message: 'Food item not found in the order' });
//         }
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };
// Get all orders

export const updateFoodItemStatus = async (req, res) => {
    const { tableNo, foodItemId, status, createdAt } = req.body;

    // Validate status
    if (!['on hold', 'working', 'ready'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    // Validate createdAt
    if (!createdAt || isNaN(new Date(createdAt).getTime())) {
        return res.status(400).json({ message: 'Invalid createdAt date' });
    }

    try {
        // Parse createdAt from request body
        const createdAtDate = new Date(createdAt);

        // Find the order for the given tableNo
        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Find the index of the food item in the ordersList that matches both foodItemId and createdAt
        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            // Update the status of the food item
            order.ordersList[existingItemIndex].status = status;
            order.ordersList[existingItemIndex].updatedAt = Date.now();

            // Save the updated order
            await order.save();

            // Emit the updated order to clients
            req.io.emit('orderUpdated', order);

            res.status(200).json(order);
        } else {
            res.status(404).json({ message: 'Food item not found in the order' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};


export const getAllOrders = async (req, res) => {
    try {
        // const orders = await Order.find();
        const orders = await Order.find({orderStatus:'processing',kotStatus:'confirmed'});
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
// Get all orders admin only
// export const getAllOrdersAdmin = async (req, res) => {
//     try {
//         // const orders = await Order.find();
//         const orders = await Order.find();
//         res.status(200).json(orders);
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

// export const getAllOrdersAdmin = async (req, res) => {
//     try {
//         // Fetch all orders
//         const orders = await Order.find();

//         // Helper functions
//         const getMonthlyData = (start, end) => {
//             return orders.filter(order => 
//                 new Date(order.createdAt) >= start && new Date(order.createdAt) <= end
//             );
//         };

//         const getPercentageChange = (current, previous) => {
//             if (previous === 0) return 100; // Avoid division by zero
//             return ((current - previous) / previous) * 100;
//         };

//         const getTotalRevenue = (orders) => orders.reduce((sum, order) => sum + order.afterDiscountPrice, 0);

//         // Date calculations
//         const currentDate = moment();
//         const startOfMonth = currentDate.startOf('month').toDate();
//         const endOfMonth = currentDate.endOf('month').toDate(); // Ensure you get the end date of the current month
        
//         // Ensure you are correctly setting the start and end dates of last month
//         const startOfLastMonth = moment().subtract(1, 'month').startOf('month').toDate();
//         const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

//         // Calculate total orders count
//         const totalOrders = orders.length;
//         const thisMonthOrders = getMonthlyData(startOfMonth, endOfMonth).length;
//         const lastMonthOrders = getMonthlyData(startOfLastMonth, endOfLastMonth).length;
//         const orderCountPercentage = getPercentageChange(thisMonthOrders, lastMonthOrders);

//         // Calculate revenue
//         const thisMonthRevenue = getTotalRevenue(getMonthlyData(startOfMonth, endOfMonth));
//         const lastMonthRevenue = getTotalRevenue(getMonthlyData(startOfLastMonth, endOfLastMonth));
//         const revenuePercentage = getPercentageChange(thisMonthRevenue, lastMonthRevenue);

//         // Calculate average order value
//         const averageOrderValue = (total, count) => count === 0 ? 0 : total / count;
//         const avgOrderValueThisMonth = averageOrderValue(thisMonthRevenue, thisMonthOrders);
//         const avgOrderValueLastMonth = averageOrderValue(lastMonthRevenue, lastMonthOrders);
//         const avgOrderValuePercentage = getPercentageChange(avgOrderValueThisMonth, avgOrderValueLastMonth);

//         // Customer satisfaction is assumed to be static for simplicity
//         const customerSatisfaction = 4.5;
//         const satisfactionPercentage = 0; // Placeholder

//         // Get recent orders (top 5)
//         const recentOrders = orders
//             .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//             .slice(0, 5);

//         // Calculate popular menu items
//         const menuItemCounts = orders.reduce((acc, order) => {
//             order.ordersList.forEach(item => {
//                 acc[item.foodItemName] = (acc[item.foodItemName] || 0) + 1;
//             });
//             return acc;
//         }, {});

//         // Transform menu item counts to an array of objects
//         const popularMenuItemsArray = Object.entries(menuItemCounts).map(([foodItemName, count]) => ({
//             label: foodItemName,
//             value: count
//         }));

//         // Sort the array by count in descending order and get the top 5
//         const top5PopularMenuItems = popularMenuItemsArray
//             .sort((a, b) => b.value - a.value)
//             .slice(0, 5);

//         // Send response with analytics
//         res.status(200).json({
//             totalOrders: {
//                 count: totalOrders,
//                 thisMonth: thisMonthOrders,
//                 lastMonth: lastMonthOrders,
//                 percentageChange: orderCountPercentage
//             },
//             revenue: {
//                 thisMonth: thisMonthRevenue,
//                 lastMonth: lastMonthRevenue,
//                 percentageChange: revenuePercentage
//             },
//             averageOrderValue: {
//                 thisMonth: avgOrderValueThisMonth,
//                 lastMonth: avgOrderValueLastMonth,
//                 percentageChange: avgOrderValuePercentage
//             },
//             customerSatisfaction: {
//                 rating: customerSatisfaction,
//                 percentageChange: satisfactionPercentage
//             },
//             recentOrders,
//             popularMenuItems: top5PopularMenuItems,
//             // Financial Insights are not implemented in this example
//         });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// };

export const getAllOrdersAdmin = async (req, res) => {
    try {
        // Fetch all orders
        const orders = await Order.find();

        // Helper functions
        const getMonthlyData = (start, end) => {
            return orders.filter(order => 
                new Date(order.createdAt) >= start && new Date(order.createdAt) <= end
            );
        };

        const getPercentageChange = (current, previous) => {
            if (previous === 0) return 100; // Avoid division by zero
            return ((current - previous) / previous) * 100;
        };

        const getTotalRevenue = (orders) => orders.reduce((sum, order) => sum + order.afterDiscountPrice, 0);

        const getTotalCustomers = (orders) => orders.reduce((sum, order) => sum + (order.customerNo || 0), 0);

        // Date calculations
        const currentDate = moment();
        const startOfMonth = currentDate.startOf('month').toDate();
        const endOfMonth = currentDate.endOf('month').toDate();
        const startOfLastMonth = moment().subtract(1, 'month').startOf('month').toDate();
        const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

        // Calculate total orders count
        const totalOrders = orders.length;
        const thisMonthOrders = getMonthlyData(startOfMonth, endOfMonth).length;
        const lastMonthOrders = getMonthlyData(startOfLastMonth, endOfLastMonth).length;
        const orderCountPercentage = getPercentageChange(thisMonthOrders, lastMonthOrders);

        // Calculate revenue
        const thisMonthRevenue = getTotalRevenue(getMonthlyData(startOfMonth, endOfMonth));
        const lastMonthRevenue = getTotalRevenue(getMonthlyData(startOfLastMonth, endOfLastMonth));
        const revenuePercentage = getPercentageChange(thisMonthRevenue, lastMonthRevenue);

        // Calculate customer counts
        const thisMonthCustomers = getTotalCustomers(getMonthlyData(startOfMonth, endOfMonth));
        const lastMonthCustomers = getTotalCustomers(getMonthlyData(startOfLastMonth, endOfLastMonth));
        const overallCustomers = getTotalCustomers(orders);
        const customerCountPercentage = getPercentageChange(thisMonthCustomers, lastMonthCustomers);

        // Calculate average order value
        const averageOrderValue = (total, count) => count === 0 ? 0 : total / count;
        const avgOrderValueThisMonth = averageOrderValue(thisMonthRevenue, thisMonthOrders);
        const avgOrderValueLastMonth = averageOrderValue(lastMonthRevenue, lastMonthOrders);
        const avgOrderValuePercentage = getPercentageChange(avgOrderValueThisMonth, avgOrderValueLastMonth);

        // Customer satisfaction is assumed to be static for simplicity
        const customerSatisfaction = 4.5;
        const satisfactionPercentage = 0; // Placeholder

        // Get recent orders (top 5)
        const recentOrders = orders
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);

        // Calculate popular menu items
        const menuItemCounts = orders.reduce((acc, order) => {
            order.ordersList.forEach(item => {
                acc[item.foodItemName] = (acc[item.foodItemName] || 0) + 1;
            });
            return acc;
        }, {});

        // Transform menu item counts to an array of objects
        const popularMenuItemsArray = Object.entries(menuItemCounts).map(([foodItemName, count]) => ({
            label: foodItemName,
            value: count
        }));

        // Sort the array by count in descending order and get the top 5
        const top5PopularMenuItems = popularMenuItemsArray
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Send response with analytics
        res.status(200).json({
            totalOrders: {
                count: totalOrders,
                thisMonth: thisMonthOrders,
                lastMonth: lastMonthOrders,
                percentageChange: orderCountPercentage
            },
            totalCustomers: {
                count:overallCustomers,
                thisMonth: thisMonthCustomers,
                lastMonth: lastMonthCustomers,
                percentageChange: customerCountPercentage
            },
            revenue: {
                thisMonth: thisMonthRevenue,
                lastMonth: lastMonthRevenue,
                percentageChange: revenuePercentage
            },
            averageOrderValue: {
                thisMonth: avgOrderValueThisMonth,
                lastMonth: avgOrderValueLastMonth,
                percentageChange: avgOrderValuePercentage
            },
            customerSatisfaction: {
                rating: customerSatisfaction,
                percentageChange: satisfactionPercentage
            },
            recentOrders,
            popularMenuItems: top5PopularMenuItems,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// New API to update discount percentage
export const updateDiscountPercent = async (req, res) => {
    const { tableNo, discountPercent  } = req.body;

    try {
        if (discountPercent < 0 || discountPercent > 100) {
            return res.status(400).json({ message: 'Discount percentage must be between 0 and 100' });
        }

        const order = await Order.findOne({ tableNo ,orderStatus:'processing'});

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.discountPercent = discountPercent;
        order.afterDiscountPrice = order.totalPrice - (order.totalPrice * (discountPercent / 100));

        await order.save();
        req.io.emit('orderUpdated', order);

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// New API to add customer name
export const addCustomerName = async (req, res) => {
    const { tableNo,customerName  } = req.body;

    try {

        const order = await Order.findOne({ tableNo ,orderStatus:'processing'});

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (customerName) {
            order.customerName = customerName; // Update customer name if provided
        }

        await order.save();
        req.io.emit('orderUpdated', order);

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const addCustomerNo = async (req, res) => {
    const { tableNo,customerNo  } = req.body;

    try {

        const order = await Order.findOne({ tableNo ,orderStatus:'processing'});

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (customerNo) {
            order.customerNo = customerNo; // Update customer name if provided
        }

        await order.save();
        req.io.emit('orderUpdated', order);

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
// New API to update payment type
export const updatePaymentType = async (req, res) => {
    const { tableNo, paymentType } = req.body;

    try {
        const order = await Order.findOne({ tableNo ,orderStatus:'processing'});

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentType = paymentType;

        await order.save();
        req.io.emit('orderUpdated', order);

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
export const updateOrderStatus = async (req, res) => {
    const { tableNo, newStatus } = req.body;

    // Validate the new status
    if (!['processing', 'completed'].includes(newStatus)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        // Find the order by table number and ensure it is in 'processing' status
        const order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not in processing status' });
        }

        // Update the order status
        order.orderStatus = newStatus;

        // Save the updated order
        await order.save();

        // Emit the updated order to clients
        req.io.emit('orderUpdated', order);

        // Return the updated order
        res.status(200).json(order);
    } catch (error) {
        // Handle any errors
        res.status(400).json({ message: error.message });
    }
};

export const updateOrderKotStatus = async (req, res) => {
    const { tableNo, newKotStatus } = req.body;

    // Validate the new kotStatus
    if (!['null', 'confirmed'].includes(newKotStatus)) {
        return res.status(400).json({ message: 'Invalid kotStatus value' });
    }
    try {
        // Find the order by table number and ensure it is in a valid state
        const order = await Order.findOne({ tableNo, orderStatus: 'processing' });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        // Update the kotStatus
        order.kotStatus = newKotStatus;
        // Save the updated order
        await order.save();
        // Emit the updated order to clients
        req.io.emit('orderUpdated', order);
        // Return the updated order
        res.status(200).json(order);
    } catch (error) {
        // Handle any errors
        res.status(400).json({ message: error.message });
    }
};
// export const updateOrderNote = async (req, res) => {
//     const { tableNo, foodItemId, orderNote } = req.body;

//     try {
//         // Find the order for the given tableNo
//         let order = await Order.findOne({ tableNo, orderStatus:'processing' });

//         if (!order) {
//             return res.status(404).json({ message: 'Order not found' });
//         }

//         // Find the index of the food item in the ordersList
//         const existingItemIndex = order.ordersList.findIndex(item => item.foodItemId.toString() === foodItemId);

//         if (existingItemIndex >= 0) {
//             // Update the quantity and quantityWithPrice
//             order.ordersList[existingItemIndex].orderNote = orderNote;
//             order.ordersList[existingItemIndex].updatedAt = Date.now();
//             // Save the updated order
//             await order.save();

//             // Emit the updated order to clients
//             req.io.emit('orderUpdated', order);

//             res.status(200).json(order);
//         } else {
//             res.status(404).json({ message: 'Food item not found in the order' });
//         }
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// };

export const updateOrderNote = async (req, res) => {
    const { tableNo, foodItemId, orderNote, createdAt } = req.body;

    try {
        // Find the order for the given tableNo
        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Parse createdAt from request body
        const createdAtDate = new Date(createdAt);

        // Find the index of the food item in the ordersList that matches both foodItemId and createdAt
        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            // Get the existing item
            const existingItem = order.ordersList[existingItemIndex];

            // Update the orderNote and updatedAt fields
            existingItem.orderNote = orderNote;
            existingItem.updatedAt = new Date(); // Use Date object for consistency

            // Save the updated order
            await order.save();

            // Emit the updated order to clients
            req.io.emit('orderUpdated', order);

            // Return the updated item including createdAt
            const updatedItem = {
                ...existingItem.toObject(), // Convert mongoose document to plain object
                createdAt: existingItem.createdAt, // Preserve the creation date
                updatedAt: existingItem.updatedAt // Include the updated date
            };

            res.status(200).json(updatedItem);
        } else {
            res.status(404).json({ message: 'Food item not found in the order' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
