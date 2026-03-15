import mongoose from "mongoose";

async function connectDB() {
    if (!process.env.MONGO_URI) {
        throw new Error("Missing MONGO_URI in environment");
    }
    
    console.log('Attempting to connect to MongoDB...');
    
    //if there exits a connection then it returns old connection
    if (mongoose.connection.readyState >= 1) {
        console.log('Using existing MongoDB connection');
        return mongoose.connection;
    }

    // Production-ready connection options
    const options = {
        maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || '10', 10),
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000, // Increased for Atlas connections
        socketTimeoutMS: 45000,
        connectTimeoutMS: 25000, // Added connection timeout
        // Enable retryable writes and reads
        retryWrites: true,
        retryReads: true,
        // Additional Atlas-specific options
        maxIdleTimeMS: 30000,
        heartbeatFrequencyMS: 10000,
    };

    try {
        await mongoose.connect(process.env.MONGO_URI, options);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        
        // Provide helpful error messages for common issues
        if (error.message.includes('Server selection timed out')) {
            console.error('Possible causes:');
            console.error('1. Network connectivity issues');
            console.error('2. MongoDB Atlas IP whitelist not configured');
            console.error('3. Incorrect connection string');
            console.error('4. MongoDB Atlas cluster is paused or unavailable');
        }
        
        throw error;
    }
    
    // Connection event handlers
    mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB reconnected');
    });

    return mongoose.connection;
}

export default connectDB;
