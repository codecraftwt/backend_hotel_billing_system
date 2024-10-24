import express from 'express';
import http from 'http';
import mongoose from 'mongoose';
import router from './routes/diningTableRoutes.js';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors'; 
import connectDB from './config/db.js';
import dotenv from 'dotenv';
import * as faceRecognitionService from './services/faceRecognitionService.js';
// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Create HTTP server and integrate it with Socket.IO
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*', // Allow Angular frontend
    methods: ['GET', 'POST','PUT','PATCH','DELETE'],
    credentials: true // Allow credentials (cookies, HTTP authentication)
  }
});

// Middleware to handle CORS
app.use(cors({
  origin: "*", // Allow requests from Angular frontend
  methods: ['GET', 'POST','PUT','PATCH','DELETE'],
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
// app.use(express.json());
app.use(express.json({ limit: '50mb' })); // Adjust the limit as needed
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // For URL-encoded data

// Routes
app.get('/', (req, res) => {
  res.send("Hello, there!! this is Hotel Billing server backend");
});

app.use('/api', router);

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('signup', async (data) => {
    const { username, photo } = data;
    const result = await faceRecognitionService.signup(username, photo);
    socket.emit('signupResponse', result);
  });

  socket.on('login', async (data) => {
    const { photo } = data;
    const result = await faceRecognitionService.login(photo);
    socket.emit('loginResponse', result);
  });

  socket.on('logout', async (data) => {
    const { photo } = data;
    const result = await faceRecognitionService.logout(photo);
    socket.emit('logoutResponse', result);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server
server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
