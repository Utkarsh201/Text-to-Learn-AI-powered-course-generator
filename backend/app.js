import 'dotenv/config';

import express from 'express';
import cors from 'cors';

import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import courseRoutes from './routes/course.js';
import webhookRoutes from './routes/webhook.js';
import prisma from './prisma/client.js';

import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// This is critical because QStash signs the raw body — if we re-serialize
// with JSON.stringify(req.body), whitespace/key-order differences break verification.
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf.toString();
  }
}));

app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/webhooks', webhookRoutes);

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
