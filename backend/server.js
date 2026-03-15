import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { auth } from 'express-openid-connect';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import './services/emailWorker.js';
import authRoutes from './routes/auth.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Auth0 Configuration
// Note: You must add these variables to your .env file
const authConfig = {
  authRequired: false, // Set to true to require auth on all routes
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET || 'a_long_randomly_generated_string_for_testing',
  baseURL: process.env.BASE_URL || `http://localhost:${PORT}`,
  clientID: process.env.AUTH0_CLIENT_ID,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL
};

// Database Connection
connectDB().catch(err => {
  console.error(err);
  process.exit(1);
});


// CORS Configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(authConfig));

// Import Auth Routes
app.use('/api/auth', authRoutes);

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is connected!', isAuthenticated: req.oidc.isAuthenticated() });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});





// what are hte 