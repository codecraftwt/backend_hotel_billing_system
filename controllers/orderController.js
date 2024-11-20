import moment from "moment";
import FoodItem from "../models/FoodItem.js";
import Order from "../models/Order.js";

export const createOrUpdateOrder = async (req, res) => {
    const { tableNo, foodItemId } = req.body;
    const currentTime = new Date();
    const bufferTime = 60 * 1000; // 60 seconds in milliseconds

    try {
        const foodItem = await FoodItem.findById(foodItemId);
        if (!foodItem) {
            return res.status(404).json({ message: 'Food item not found' });
        }

        const { name: foodItemName, price: itemPrice, img, type } = foodItem;
        const quantity = 1;

        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (order) {
            if (order.kotStatus === 'confirmed') {
                const existingItems = order.ordersList.filter(item => item.foodItemId.toString() === foodItemId);
                const itemToUpdate = existingItems.find(item => {
                    const existingItemTime = new Date(item.createdAt);
                    return (currentTime - existingItemTime) <= bufferTime;
                });

                if (itemToUpdate) {
                    const itemIndex = order.ordersList.findIndex(item => item._id.toString() === itemToUpdate._id.toString());
                    order.ordersList[itemIndex].quantity += quantity;
                    order.ordersList[itemIndex].quantityWithPrice = order.ordersList[itemIndex].quantity * order.ordersList[itemIndex].itemPrice;
                    order.ordersList[itemIndex].updatedAt = currentTime;
                } else {
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

                await order.save();
                const updatedOrder = await Order.findOne({ tableNo, orderStatus: 'processing' });
                req.io.emit('orderUpdated', updatedOrder);
                return res.status(200).json(updatedOrder);

            } else {
                const existingItemIndex = order.ordersList.findIndex(item => item.foodItemId.toString() === foodItemId);

                if (existingItemIndex >= 0) {
                    order.ordersList[existingItemIndex].quantity += quantity;
                    order.ordersList[existingItemIndex].quantityWithPrice = order.ordersList[existingItemIndex].quantity * order.ordersList[existingItemIndex].itemPrice;
                    order.ordersList[existingItemIndex].updatedAt = currentTime; 
                } else {
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

                await order.save();

                const updatedOrder = await Order.findOne({ tableNo, orderStatus: 'processing' });
                req.io.emit('orderUpdated', updatedOrder);

                return res.status(200).json(updatedOrder);
            }
        } else {
            const newOrder = new Order({
                tableNo,
                orderStatus: 'processing', 
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

            const savedOrder = await Order.findOne({ tableNo, orderStatus: 'processing' });
            req.io.emit('orderUpdated', savedOrder);

            return res.status(200).json(savedOrder);
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};



export const getOrderByTableNo = async (req, res) => {
    const { tableNo } = req.params;
    try {
        const order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not processing' });
        }
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateFoodItemQuantity = async (req, res) => {
    const { tableNo, foodItemId, quantity, createdAt } = req.body;

    try {
        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be greater than zero' });
        }

        const createdAtDate = new Date(createdAt);

        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            order.ordersList[existingItemIndex].quantity = quantity;
            order.ordersList[existingItemIndex].quantityWithPrice = quantity * order.ordersList[existingItemIndex].itemPrice;
            order.ordersList[existingItemIndex].updatedAt = Date.now();

            await order.save();

            req.io.emit('orderUpdated', order);

            const updatedItem = {
                ...order.ordersList[existingItemIndex].toObject(), 
                createdAt: order.ordersList[existingItemIndex].createdAt, 
                updatedAt: order.ordersList[existingItemIndex].updatedAt 
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
        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        const createdAtDate = new Date(createdAt);

        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            order.ordersList.splice(existingItemIndex, 1);

            if (order.ordersList.length === 0) {
                await order.deleteOne({ tableNo });

                req.io.emit('orderUpdated', { tableNo });

                return res.status(200).json({ message: 'Order deleted' });
            } else {
                await order.save();

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

export const updateFoodItemStatus = async (req, res) => {
    const { tableNo, foodItemId, status, createdAt } = req.body;

    if (!['on hold', 'working', 'ready'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    if (!createdAt || isNaN(new Date(createdAt).getTime())) {
        return res.status(400).json({ message: 'Invalid createdAt date' });
    }

    try {
        const createdAtDate = new Date(createdAt);

        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            order.ordersList[existingItemIndex].status = status;
            order.ordersList[existingItemIndex].updatedAt = Date.now();

            await order.save();

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
        const orders = await Order.find({orderStatus:'processing',kotStatus:'confirmed'});
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrdersAdmin = async (req, res) => {
    try {
        const orders = await Order.find();

        const getMonthlyData = (start, end) => {
            return orders.filter(order => 
                new Date(order.createdAt) >= start && new Date(order.createdAt) <= end
            );
        };

        const getPercentageChange = (current, previous) => {
            if (previous === 0) return 100; 
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



export const getAllOrdersAdminGraph = async (req, res) => {
    try {
        const orders = await Order.find();

        const getMonthlyData = (start, end) => {
            return orders.filter(order => 
                new Date(order.createdAt) >= start && new Date(order.createdAt) <= end
            );
        };

        const getTotalRevenue = (orders) => orders.reduce((sum, order) => sum + order.afterDiscountPrice, 0);

        const getTotalCustomers = (orders) => orders.reduce((sum, order) => sum + (order.customerNo || 0), 0);

        const averageOrderValue = (total, count) => count === 0 ? 0 : total / count;

        const getAllMonths = (orders) => {
            const months = [];
            orders.forEach(order => {
                const month = new Date(order.createdAt);
                if (!months.some(m => m.getFullYear() === month.getFullYear() && m.getMonth() === month.getMonth())) {
                    months.push(month);
                }
            });
            return months.sort((a, b) => a - b); 
        };

        const months = getAllMonths(orders);

        const orderData = {
            totalOrders: [],
            totalCustomers: [],
            revenue: [],
            averageOrderValue: [],
        };

        months.forEach(month => {
            const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
            const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);

            const monthlyOrders = getMonthlyData(startOfMonth, endOfMonth);
            const monthlyRevenue = getTotalRevenue(monthlyOrders);
            const monthlyCustomers = getTotalCustomers(monthlyOrders);
            const avgOrderValue = averageOrderValue(monthlyRevenue, monthlyOrders.length);

            orderData.totalOrders.push({ x: startOfMonth, y: monthlyOrders.length });
            orderData.totalCustomers.push({ x: startOfMonth, y: monthlyCustomers });
            orderData.revenue.push({ x: startOfMonth, y: monthlyRevenue });
            orderData.averageOrderValue.push({ x: startOfMonth, y: avgOrderValue });
        });

        res.status(200).json({
            totalOrders: orderData.totalOrders,
            totalCustomers: orderData.totalCustomers,
            revenue: orderData.revenue,
            averageOrderValue: orderData.averageOrderValue,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


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
export const addCustomerName = async (req, res) => {
    const { tableNo,customerName  } = req.body;

    try {

        const order = await Order.findOne({ tableNo ,orderStatus:'processing'});

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (customerName) {
            order.customerName = customerName; 
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
            order.customerNo = customerNo; 
        }

        await order.save();
        req.io.emit('orderUpdated', order);

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
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

    if (!['processing', 'completed'].includes(newStatus)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    try {
        const order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not in processing status' });
        }

        order.orderStatus = newStatus;

        await order.save();

        req.io.emit('orderUpdated', order);

        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateOrderKotStatus = async (req, res) => {
    const { tableNo, newKotStatus } = req.body;

    if (!['null', 'confirmed'].includes(newKotStatus)) {
        return res.status(400).json({ message: 'Invalid kotStatus value' });
    }
    try {
        const order = await Order.findOne({ tableNo, orderStatus: 'processing' });
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        order.kotStatus = newKotStatus;
        await order.save();
        req.io.emit('orderUpdated', order);
        res.status(200).json(order);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const updateOrderNote = async (req, res) => {
    const { tableNo, foodItemId, orderNote, createdAt } = req.body;

    try {
        let order = await Order.findOne({ tableNo, orderStatus: 'processing' });

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const createdAtDate = new Date(createdAt);

        const existingItemIndex = order.ordersList.findIndex(item =>
            item.foodItemId.toString() === foodItemId && new Date(item.createdAt).getTime() === createdAtDate.getTime()
        );

        if (existingItemIndex >= 0) {
            const existingItem = order.ordersList[existingItemIndex];

            existingItem.orderNote = orderNote;
            existingItem.updatedAt = new Date(); 

            await order.save();

            req.io.emit('orderUpdated', order);

            const updatedItem = {
                ...existingItem.toObject(), 
                createdAt: existingItem.createdAt, 
                updatedAt: existingItem.updatedAt 
            };

            res.status(200).json(updatedItem);
        } else {
            res.status(404).json({ message: 'Food item not found in the order' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
