import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/taphair';
    logger.info(`Attempting to connect to MongoDB at: ${mongoURI}`);

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    logger.info(`MongoDB Connected Successfully: ${conn.connection.host}`);
    logger.info(`Database Name: ${conn.connection.name}`);
    logger.info(`Connection State: ${conn.connection.readyState}`);

    // Vérifier les collections existantes
    const collections = await conn.connection.db.listCollections().toArray();
    logger.info('Existing collections:', collections.map(c => c.name));

  } catch (error) {
    logger.error('MongoDB Connection Error:', error);
    logger.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    process.exit(1);
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