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
  // Setting credentials: true tells the browser: "It is safe to send cookies, authorization headers, or TLS client certificates back and forth with this specific backend.
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
  // authorization is to send the berar token to the backend
  // content-type is to tell the backend what type of content
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// express.urlencoded() parses incoming requests where the payload is formatted as a URL-encoded string
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
    const response = { message: 'Backend is running but database is not connected' };

    if (process.env.NODE_ENV !== 'production') {
      response.error = error.message;
    }

    res.status(500).json(response);
  }
});

// 404 Not Found Middleware - Catch all unknown routes

// if doesnot matches any routes it will fallback here and will throw an error 
app.use((req, res, next) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.originalUrl} does not exist` });
});

// Global error handler (handles auth errors and fallbacks)
app.use(errorHandler);

export default app;
