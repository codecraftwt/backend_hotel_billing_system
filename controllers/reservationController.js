import Reservation from '../models/Reservation.js';

// Create a new reservation
// Create a new reservation
export const createReservation = async (req, res) => {
    const { reservationName, numberOfPeople, tableNumber, userPhoneNumber, reservationDateTime } = req.body.data;
  console.log(req.body,'req.body');
  
    // Simple validation
    if (!reservationName || !numberOfPeople || !tableNumber || !userPhoneNumber || !reservationDateTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }
  
    // Create the reservation
    try {
      const reservation = new Reservation({
        reservationName,
        numberOfPeople,
        tableNumber,
        userPhoneNumber,
        reservationDateTime,
      });
  
      await reservation.save();
      req.io.emit('reservation', reservation);
      res.status(201).json({ message: 'Reservation created successfully', reservation });
    } catch (error) {
      res.status(400).json({ message: 'Error creating reservation', error });
    }
  };
  

// Get all reservations
// export const getAllReservations = async (req, res) => {
//   try {
//     const reservations = await Reservation.find({reservationStatus:'processing'});
//     res.status(200).json(reservations);
//   } catch (error) {
//     res.status(500).json({ message: 'Error fetching reservations', error });
//   }
// };
export const getAllReservations = async (req, res) => {
    try {
      const today = new Date();
      // Set the start and end of today
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
      // Query for reservations with status 'processing' and today's date
      const reservations = await Reservation.find({
        reservationStatus: 'processing',
        reservationDateTime: { $gte: startOfDay, $lt: endOfDay } // Use reservationDateTime here
      });
  
      res.status(200).json(reservations);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching reservations', error });
    }
  };
  
// Get a reservation by ID
export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    res.status(200).json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reservation', error });
  }
};

// Delete a reservation
export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }
    const reservations = await Reservation.find({
        reservationStatus: 'processing',
        // Use reservationDateTime here
      });
      req.io.emit('reservation', reservation);
    res.status(200).json({ message: 'Reservation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting reservation', error });
  }
};

// Update reservation status
export const updateReservationStatus = async (req, res) => {
    const { tableNumber, status } = req.body;
  
    if (!tableNumber || !status) {
      return res.status(400).json({ message: 'Table number and status are required' });
    }
  
    try {
      const reservation = await Reservation.findOneAndUpdate(
        { tableNumber: tableNumber }, // Find reservation by table number
        { reservationStatus: status }, // Update status
        { new: true } // Return the updated document
      );
  
      if (!reservation) {
        return res.status(404).json({ message: 'Reservation not found' });
      }
      req.io.emit('reservation', reservation);
      res.status(200).json({ message: 'Reservation status updated successfully', reservation });
    } catch (error) {
      res.status(500).json({ message: 'Error updating reservation status', error });
    }
  };
  
