import Order from "../models/Order.js";
import Status from "../models/Status.js";

export const createOrUpdateStatus = async (req, res) => {
    const { tableNo, status } = req.body;

    try {
        // Find the existing status
        let existingStatus = await Status.findOne({ tableNo });

        // If status does not exist, create a new one
        if (!existingStatus) {
            existingStatus = new Status({ tableNo, status });
        } else {
            // Update existing status
            existingStatus.status = status;
        }

        // If status is 'gray', check if any orders exist
        if (status === 'gray') {
            const orderExists = await Order.exists({ tableNo });
            if (orderExists) {
                existingStatus.status = 'gray'; // Ensure status remains 'gray'
            }
        }

        await existingStatus.save();

        // Emit the updated status using Socket.IO
        req.io.emit('statusUpdated', { tableNo, status: existingStatus.status });

        res.status(200).json({ message: 'Status updated successfully', status: existingStatus.status });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getStatusByTableNo = async (req, res) => {
    const { tableNo } = req.params;
    try {
        const status = await Status.findOne({ tableNo });

        if (!status) {
            return res.status(404).json({ message: 'Status not found for this tableNo' });
        }

        res.status(200).json(status);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};