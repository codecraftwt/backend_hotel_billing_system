import User from '../models/User.js';

// Signup: Create a new user
export const signupUser = async (req, res) => {
  const { username, usePass, role } = req.body;

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const newUser = new User({
      username,
      usePass,
      role,
      timesheet: [{
        date: new Date(), 
        checkInTime: null,
        checkOutTime: null,
        status: 'off duty'
      }]
    });
    
    await newUser.save();
    req.io.emit('user', newUser);
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

    const today = new Date().setHours(0, 0, 0, 0);
    const timesheetEntry = user.timesheet.find(entry => entry.date.setHours(0, 0, 0, 0) === today);

    if (!timesheetEntry) {
      user.timesheet.push({
        date: new Date(),
        checkInTime: new Date(),
        status: 'on duty',
      });
      await user.save();

      req.io.emit('user', user);
      return res.status(200).json(user);
    } else {
      if (timesheetEntry.status === 'on duty') {
        timesheetEntry.checkOutTime = new Date();
        timesheetEntry.status = 'off duty';
        await user.save();

        req.io.emit('user', user); 
        return res.status(200).json(user);
      } else {
        timesheetEntry.checkInTime = new Date();
        timesheetEntry.status = 'on duty';
        await user.save();

        req.io.emit('user', user);
        return res.status(200).json(user);
      }
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
        user.save(); 
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

