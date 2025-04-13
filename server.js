const express = require('express');
const connectDB = require('./db');
const userRoutes = require('./routes/RouteUser');
const cors = require('cors');
require('dotenv').config();
const path = require('path');

const app = express();

// Connect to MongoDB
connectDB();
 
// Body parsing middleware - MUST come before request logging
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  if (req.method !== 'GET') {
    console.log('Body:', req.body);
  }
  next();
});

// Security and CORS middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Serve static files with caching
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '1d',
  etag: true
}));

// API Routes with prefix
app.use('/', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Welcome to the API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Handle Multer errors
  if (err.name === 'MulterError') {
    return res.status(400).json({ 
      message: 'File upload error',
      error: err.message
    });
  }

  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Handle 404 routes
app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    available_routes: ['/api/user', '/api/assistant', '/api/doctor']
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 API URL: http://localhost:${PORT}`);
  console.log(`📁 Upload directory: ${path.join(__dirname, 'uploads')}`);
});