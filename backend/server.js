import 'dotenv/config';
import app from './app.js';
import prisma from './utils/prisma.js';
import courseQueue from './services/courseQueue.js';
import courseWorker from './services/courseWorker.js';

const PORT = process.env.PORT || 5000;

// prisma connection is automatic 
// by default the Prisma will establish connection lazily.

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nGracefully shutting down (Ctrl-C)...');
  console.log('Closing background queues to protect in-flight tasks...');
  await courseWorker.close();
  await courseQueue.close();
  console.log('Disconnecting from database...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
});


// things happeing in the server.js file
// 1. starts the server
// 2. imports the courseWorker.js file which starts the background worker listeners
// 3. closing the course and disconnecting the prisma