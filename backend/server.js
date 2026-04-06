// TODO: Have to use PostgreSQL (via Prisma) here — initialize Prisma Client for DB access
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import './services/emailWorker.js';
import authRoutes from './routes/auth.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// TODO: Have to use PostgreSQL connection here — replace old MongoDB connectDB() with Prisma Client initialization


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



// Import Auth Routes
app.use('/api/auth', authRoutes);

// Test Route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is connected!' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});