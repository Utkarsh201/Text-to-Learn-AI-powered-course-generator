import 'dotenv/config';
import app from './app.js';
import prisma from './prisma/client.js';

const PORT = process.env.PORT || 5000;

// prisma connection is automatic 
// by default the Prisma will establish connection lazily.

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down (Ctrl-C)...');
  console.log('Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});

// things happening in the server.js file
// 1. starts the server
// 2. QStash handles background jobs via webhooks (no in-process worker needed)
// 3. graceful shutdown disconnects prisma