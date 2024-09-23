import User from '../models/User.js';

// Signup: Create a new user
export const signupUser = async (req, res) => {
  const { username, usePass, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create a new user with a default timesheet entry
    const newUser = new User({
      username,
      usePass,
      role,
      timesheet: [{
        date: new Date(), // Set the date to today
        checkInTime: null,
        checkOutTime: null,
        status: 'off duty' // Default status
      }]
    });
    
    await newUser.save();
    req.io.emit('user', newUser); // Emit the new user data
    res.status(201).json({ message: 'User created successfully', username });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Login: Authenticate user and update timesheet
export const loginUser = async (req, res) => {
  const { usePass } = req.body;

  try {
    const user = await User.findOne({ usePass });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const today = new Date().setHours(0, 0, 0, 0); // Get today's date at midnight
    const timesheetEntry = user.timesheet.find(entry => entry.date.setHours(0, 0, 0, 0) === today);

    if (!timesheetEntry) {
      // If no entry exists for today, create one and log the user in
      user.timesheet.push({
        date: new Date(),
        checkInTime: new Date(),
        status: 'on duty',
      });
      await user.save();

      req.io.emit('user', user); // Emit user data on login
      return res.status(200).json(user);
    } else {
      // If an entry exists, check the status
      if (timesheetEntry.status === 'on duty') {
        // User is already on duty, log them out
        timesheetEntry.checkOutTime = new Date();
        timesheetEntry.status = 'off duty';
        await user.save();

        req.io.emit('user', user); // Emit user data on logout
        return res.status(200).json(user);
      } else {
        // User is off duty, log them in
        timesheetEntry.checkInTime = new Date();
        timesheetEntry.status = 'on duty';
        await user.save();

        req.io.emit('user', user); // Emit user data on login
        return res.status(200).json(user);
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// // Login: Authenticate user and update timesheet
// export const loginUser = async (req, res) => {
//   const { usePass } = req.body;

//   try {
//     const user = await User.findOne({ usePass });
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     const today = new Date().setHours(0, 0, 0, 0); // Get today's date at midnight
//     const timesheetEntry = user.timesheet.find(entry => entry.date.setHours(0, 0, 0, 0) === today);

//     // If no entry exists for today, create one
//     if (!timesheetEntry) {
//       user.timesheet.push({
//         date: new Date(),
//         checkInTime: new Date(),
//         status: 'on duty',
//       });
//     } else {
//       // If an entry exists, update checkInTime if not already checked in
//       if (!timesheetEntry.checkInTime) {
//         timesheetEntry.checkInTime = new Date();
//         timesheetEntry.status = 'on duty';
//       }
//     }

//     await user.save();

//     req.io.emit('user', user); // Emit user data on login
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // Logout: Update timesheet
// export const logoutUser = async (req, res) => {
//   const { usePass } = req.body;

//   try {
//     const user = await User.findOne({ usePass });
//     if (!user) return res.status(404).json({ error: 'User not found' });

//     const today = new Date().setHours(0, 0, 0, 0);
//     const timesheetEntry = user.timesheet.find(entry => entry.date.setHours(0, 0, 0, 0) === today);

//     if (!timesheetEntry || timesheetEntry.status !== 'on duty') {
//       return res.status(400).json({ error: 'User is not currently logged in' });
//     }

//     // Update check-out time and status
//     timesheetEntry.checkOutTime = new Date();
//     timesheetEntry.status = 'off duty';
//     await user.save();

//     req.io.emit('user', user); // Emit user data on logout
//     res.status(200).json(user);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// Get All Users: Retrieve all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getAllUsersTodayTimesheet = async (req, res) => {
  try {
    const users = await User.find();

    // Get today's date dynamically
    const today = new Date();
    // today.setDate(today.getDate() + 2);
    const todayStart = new Date(today.setHours(0, 0, 0, 0)); // Start of today
    const todayEnd = new Date(today.setHours(23, 59, 59, 999)); // End of today

    const todayTimesheets = users.map(user => {
      // Check if today's entry exists
      const todayEntry = user.timesheet.find(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= todayStart && entryDate <= todayEnd;
      });

      // If today’s entry doesn’t exist, add a new one
      if (!todayEntry) {
        user.timesheet.push({
          date: today.toISOString(), // Use today's date
          checkInTime: null,
          checkOutTime: null,
          status: 'off duty'
        });
        user.save(); // Save the updated user document
        req.io.emit('user', user);

      }

      // Filter today's timesheet entries
      const todayTimesheet = user.timesheet.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= todayStart && entryDate <= todayEnd;
      });

      return {
        username: user.username,
        role:user.role,
        todayTimesheet
      };
    });

    // Emit the updated timesheet data to connected clients

    res.status(200).json(todayTimesheets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

