import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import router from './routes/diningTableRoutes.js';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors'; // Import cors package
import connectDB from './config/db.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server and integrate it with Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN, // Allow Angular frontend
    methods: ['GET', 'POST','PUT','PATCH'],
    credentials: true // Allow credentials (cookies, HTTP authentication)
  }
});

// Middleware to handle CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN, // Allow requests from Angular frontend
  methods: ['GET', 'POST','PUT','PATCH'],
  credentials: true // Allow credentials (cookies, HTTP authentication)
}));

// Middleware to attach socket.io to the request object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Connect to MongoDB
connectDB()
// Middleware
app.use(express.json());

// Routes
app.use('/api', router);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
