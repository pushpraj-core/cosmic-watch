const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const neoRoutes = require('./routes/neoRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { initializeScheduler } = require('./scheduler/neoScheduler');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hackathon')
  .then(() => {
    console.log('✓ MongoDB connected');
    // Start NASA API scheduler after DB connection (900 requests/hour)
    initializeScheduler();
  })
  .catch(err => console.log('✗ MongoDB connection error:', err.message));

// Socket.io for real-time chat
io.on('connection', (socket) => {
  console.log('New user connected:', socket.id);

  socket.on('join-room', (neoId) => {
    socket.join(`neo-${neoId}`);
    console.log(`User joined room: neo-${neoId}`);
  });

  socket.on('send-message', (data) => {
    io.to(`neo-${data.neoId}`).emit('receive-message', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/neo', neoRoutes);
app.use('/api/chat', chatRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend is running!', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`\n🚀 Server running on port ${PORT}`);
  console.log(`📡 WebSocket ready for real-time updates\n`);
});

