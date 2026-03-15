const Bull = require('bull');

// Configure the Redis connection for the queue
// Falls back to localhost default Redis if no env variable is provided
const emailQueue = new Bull('welcome-email-queue', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

module.exports = emailQueue;