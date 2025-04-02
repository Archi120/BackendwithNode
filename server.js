const express = require('express');
const connectDB = require('./db'); // Your MongoDB connection file
const userRoutes = require('./routes/RouteUser'); // ✅ Make sure the filename is correct
require('dotenv').config(); // For environment variables
const path = require('path');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Serve static files (profile pictures)
//app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Hi Archi!!! Tataaaaaaaaa 🎉');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
