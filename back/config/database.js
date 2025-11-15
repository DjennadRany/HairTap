import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
  const maxRetries = parseInt(process.env.MONGO_MAX_RETRIES ?? '', 10) || 5;
  const retryDelayMs = parseInt(process.env.MONGO_RETRY_DELAY_MS ?? '', 10) || 5000;

  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      attempt += 1;
      logger.info(`Attempting to connect to MongoDB (attempt ${attempt}/${maxRetries + 1})`);

      const conn = await mongoose.connect(mongoURI);

      logger.info(`MongoDB Connected Successfully: ${conn.connection.host}`);
      logger.info(`Database Name: ${conn.connection.name}`);
      logger.info(`Connection State: ${conn.connection.readyState}`);

      // Vérifier les collections existantes
      const collections = await conn.connection.db.listCollections().toArray();
      logger.info('Existing collections:', collections.map(c => c.name));

      return conn;
    } catch (error) {
      logger.error('MongoDB Connection Error:', {
        name: error.name,
        message: error.message,
        code: error.code
      });

      if (attempt > maxRetries) {
        logger.error('Max retries reached. Unable to connect to MongoDB.');
        throw error;
      }

      logger.warn(`Retrying MongoDB connection in ${retryDelayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs));
    }
  }
};

// Gestion des événements de connexion
mongoose.connection.on('connected', () => {
  logger.info('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Mongoose disconnected from MongoDB');
});

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (err) {
    logger.error('Error during MongoDB connection closure:', err);
    process.exit(1);
  }
});

export default connectDB; 