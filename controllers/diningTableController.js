import DiningTable from '../models/DiningTable.js';
import Order from '../models/Order.js';

// Controller to handle table updates
export const updateTables = async (req, res) => {
  try {
    // Process the request (e.g., add, update, remove tables)
    // Example: Add new tables
    const tables = req.body;
    await DiningTable.insertMany(tables);

    // Emit the updated list of tables to all clients
    const updatedTables = await DiningTable.find();
    req.io.emit('updateTables', updatedTables);

    res.status(201).json(updatedTables);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Controller to get all dining tables
export const getDiningTables = async (req, res) => {
  try {
    // Fetch all dining tables and populate the 'order' field
    const tables = await DiningTable.find().populate('order');
    
    // Transform the data
    const filteredTables = tables.map(table => {
      // Check if there's an associated order
      if (table.order) {
        // Only include tables with an order that has status 'processing'
        if (table.order.orderStatus === 'processing') {
          return {
            _id: table._id,
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            status: table.status,
            order: {
              _id: table.order._id,
              totalPrice: table.order.totalPrice,
              orderStatus: table.order.orderStatus
            }
          };
        }
      }
      // Return table with null order if no processing order
      return {
        _id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        order: null
      };
    });

    // Respond with the transformed tables
    res.status(200).json(filteredTables);
  } catch (error) {
    // Handle errors
    console.error('Error fetching dining tables:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching dining tables.' });
  }
};

export const updateTableWithOrder = async (req, res) => {
  const { tableNumber } = req.params; // Assuming tableNumber is used to identify the table
  const { orderId } = req.body;

  try {
    // Check if the order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if the order's tableNo matches the tableNumber
    if (order.tableNo !== parseInt(tableNumber, 10)) {
      return res.status(400).json({ message: 'Order tableNo does not match the tableNumber' });
    }

    // Update the DiningTable with the orderId
    const updatedTable = await DiningTable.findOneAndUpdate(
      { tableNumber },
      { order: orderId },
      { new: true, runValidators: true }
    );

    if (!updatedTable) {
      return res.status(404).json({ message: 'Dining table not found' });
    }

    // Emit the updated table to all clients
    const updatedTables = await DiningTable.find();
    req.io.emit('updateTables', updatedTables);
    // req.io.emit('updateTables', updatedTable);

    res.status(200).json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

