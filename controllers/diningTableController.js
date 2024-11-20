import DiningTable from '../models/DiningTable.js';
import Order from '../models/Order.js';

// Controller to handle table updates
export const updateTables = async (req, res) => {
  try {
    const tables = req.body;
    await DiningTable.insertMany(tables);

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
    const tables = await DiningTable.find().populate('order');
    
    const filteredTables = tables.map(table => {
      if (table.order) {
        if (table.order.orderStatus === 'processing' && table.order.kotStatus=="confirmed") {
          return {
            _id: table._id,
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            status: table.status,
            order:table.order
          };
        }
      }
      return {
        _id: table._id,
        tableNumber: table.tableNumber,
        capacity: table.capacity,
        status: table.status,
        order: null
      };
    });

    res.status(200).json(filteredTables);
  } catch (error) {
    console.error('Error fetching dining tables:', error.message);
    res.status(500).json({ error: 'An error occurred while fetching dining tables.' });
  }
};

export const updateTableWithOrder = async (req, res) => {
  const { tableNumber } = req.params; 
  const { orderId } = req.body;

  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.tableNo !== parseInt(tableNumber, 10)) {
      return res.status(400).json({ message: 'Order tableNo does not match the tableNumber' });
    }

    const updatedTable = await DiningTable.findOneAndUpdate(
      { tableNumber },
      { order: orderId },
      { new: true, runValidators: true }
    );

    if (!updatedTable) {
      return res.status(404).json({ message: 'Dining table not found' });
    }

    const updatedTables = await DiningTable.find();
    req.io.emit('updateTables', updatedTables);
    res.status(200).json(updatedTable);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const updateTableStatus=async (req,res)=>{
  const { tableNumber } = req.params;
  const { status } = req.body;
  
  if (!status) {
    return res.status(400).send('Status is required');
  }

  try {
    const diningTable = await DiningTable.findOneAndUpdate(
      { tableNumber: tableNumber },
      { status: status },
      { new: true, runValidators: true }
    );

    if (!diningTable) {
      return res.status(404).send('Dining table not found');
    }
    const updatedTables = await DiningTable.find();
    req.io.emit('updateTables', updatedTables);
    res.status(201).json(updatedTables);
  } catch (error) {
    res.status(500).send('Server error');
  }

}

