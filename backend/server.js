import dotenv from 'dotenv';
import app from './app.js';
import prisma from './utils/prisma.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

// prisma connection is automatic 
// by default the Prisma will establish connection lazily.

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down (Ctrl-C)... Disconnecting from database.');
  await prisma.$disconnect();
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});