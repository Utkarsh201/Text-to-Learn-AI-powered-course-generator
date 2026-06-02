import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// Parse the Redis URL into a connection object for BullMQ
// BullMQ uses an object-based connection config instead of a URL string
const redisUrl = new URL(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const dbFromPath = redisUrl.pathname && redisUrl.pathname !== '/' ? Number(redisUrl.pathname.slice(1)) : undefined;

const connection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port) || 6379,
  ...(redisUrl.username && { username: decodeURIComponent(redisUrl.username) }),
  ...(redisUrl.password && { password: redisUrl.password }),
  ...(Number.isInteger(dbFromPath) && { db: dbFromPath }),
  ...(redisUrl.protocol === 'rediss:' && { tls: {} }),
};

// Configure the Redis connection for the course queue
const courseQueue = new Queue('course-generation-queue', { connection });

export { connection };
export default courseQueue;
