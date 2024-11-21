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
        _id:user._id,
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

// Update User Role: Update the role of an existing user
export const updateUserRole = async (req, res) => {
  const { _id, newRole } = req.body;

  // Validate newRole
  const validRoles = ['admin', 'kds', 'counter'];  // Define the possible roles
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({ error: 'Invalid role provided' });
  }

  try {
    // Find the user by username
    const user = await User.findOne({ _id });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update the user's role
    user.role = [newRole];  // Assuming the role is an array of roles, update it

    // Save the updated user
    await user.save();

    // Emit the updated user to connected clients
    req.io.emit('user', user);

    // Send the response
    res.status(200).json({ message: 'User role updated successfully', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete User: Remove a user by ID
export const deleteUser = async (req, res) => {
  const { _id } = req.params; // Assuming `_id` is passed as a route parameter

  try {
    // Find and delete the user
    const deletedUser = await User.findByIdAndDelete(_id);

    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Emit the updated user data to connected clients
    req.io.emit('user', { action: 'delete', _id });

    res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
// import User from '../models/User.js';

// Signup: Check for 4-digit password
export const checkPassword = async (req, res) => {
  const { usePass } = req.body;  // Only `usePass` is passed in the request body

  // Validate that the password is a 4-digit number
  const passwordPattern = /^\d{4}$/; // Regex to check for exactly 4 digits
  if (!passwordPattern.test(usePass)) {
    return res.status(400).json({ error: 'Password must be a 4-digit number' });
  }

  try {
    // Check if the password already exists in the database
    const existingUser = await User.findOne({ usePass });
    if (existingUser) {
      return res.status(400).json({ error: 'Password already exists' });
    }

    // If the password does not exist, return success message
    res.status(200).json({ message: 'Password is available for registration' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


