// Jasper Careless - Phase 1: Express server, sessions, and route mounting
const express = require('express');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const recipeRoutes = require('./routes/recipes');
const searchRoutes = require('./routes/search');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// Session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'cs312_recipe_secret',
    resave: false,
    saveUninitialized: false,
  })
);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/search', searchRoutes);

// Error handler for next(err) calls
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});