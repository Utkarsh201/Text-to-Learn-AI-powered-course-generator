import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import prisma from './utils/prisma.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

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

// Routes
app.use('/api/auth', authRoutes);

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

// Global error handler for auth middleware errors (express-oauth2-jwt-bearer)
app.use((err, req, res, next) => {
  if (err.status === 401) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing access token'
    });
  }
  if (err.status === 403) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Insufficient permissions'
    });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // console.log(`Auth0 Issuer: ${process.env.AUTH0_ISSUER_BASE_URL}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});