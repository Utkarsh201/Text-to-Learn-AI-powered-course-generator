import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Routes
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import prisma from './utils/prisma.js'; 

// Import Error Handler
import { errorHandler } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);

// Health check route
app.get('/api/test', async (req, res) => {
  try {
    // Verify DB connectivity by running a raw query
    await prisma.$queryRaw`SELECT 1`;
    res.json({ message: 'Backend is connected!', database: 'PostgreSQL connected via Prisma' });
  } catch (error) {
    res.json({ message: 'Backend is running but database is not connected', error: error.message });
  }
});

// 404 Not Found Middleware - Catch all unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.originalUrl} does not exist` });
});

// Global error handler (handles auth errors and fallbacks)
app.use(errorHandler);

export default app;
