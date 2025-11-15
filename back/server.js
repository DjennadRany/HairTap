import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';

import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './utils/logger.js';

import userRoutes from './routes/users.js';
import coiffeurRoutes from './routes/coiffeurs.js';
import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import serviceRoutes from './routes/services.js';
import chatRoutes from './routes/chat.js';
import favoriteRoutes from './routes/favorites.js';
import reviewRoutes from './routes/reviews.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import connectionRoutes from './routes/connections.js';
import specialtyRoutes from './routes/specialties.js';
import workingSlotRoutes from './routes/working-slots.js';
import pricingRoutes from './routes/pricing.js';
import globalSpecialtyRoutes from './routes/globalSpecialties.js';
import adminRoutes from './routes/admin.js'; // ✅ AJOUT ROUTES ADMIN
import timeChangeRequestRoutes from './routes/time-change-requests.js'; // ✅ NOUVELLES ROUTES
import notificationRoutes from './routes/notifications.js'; // ✅ NOUVELLES ROUTES NOTIFICATIONS
import commentRoutes from './routes/comments.js'; // ✅ ROUTES COMMENTAIRES
import paymentRoutes from './routes/payments.js'; // ✅ ROUTES PAIEMENTS STRIPE
// imageRoutes removed - simplified photo system

const envPath = path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

if (!process.env.JWT_SECRET) {
  logger.error('Environment variable JWT_SECRET is required but was not provided.');
  process.exit(1);
}

if (process.env.NODE_ENV !== 'production') {
  logger.debug(`.env file loaded: ${fs.existsSync(envPath)}`);
  logger.debug(`JWT_SECRET configured: ${Boolean(process.env.JWT_SECRET)}`);
}

const app = express();

// Configuration CORS contrôlée par les variables d'environnement
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
  : defaultOrigins;

const allowedMethods = process.env.CORS_METHODS
  ? process.env.CORS_METHODS.split(',').map(method => method.trim()).filter(Boolean)
  : ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'];

const allowedHeaders = process.env.CORS_ALLOWED_HEADERS
  ? process.env.CORS_ALLOWED_HEADERS.split(',').map(header => header.trim()).filter(Boolean)
  : ['Content-Type', 'Authorization', 'X-Requested-With'];

const allowCredentials = process.env.CORS_ALLOW_CREDENTIALS
  ? process.env.CORS_ALLOW_CREDENTIALS.toLowerCase() === 'true'
  : true;

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`Blocked CORS request from origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: allowCredentials,
  methods: allowedMethods,
  allowedHeaders,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Configuration Helmet plus permissive pour les images
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "blob:", "http://localhost:5000", "http://127.0.0.1:5000"],
      connectSrc: ["'self'", "http://localhost:5000", "http://127.0.0.1:5000"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// Rate Limiting configurable via les variables d'environnement
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? '', 10) || 60 * 1000;
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX ?? '', 10) || 1000;

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Body Parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Swagger Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TapHair API',
      version: '1.0.0',
      description: 'API documentation for TapHair application'
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/coiffeurs', coiffeurRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/global-specialties', globalSpecialtyRoutes);
app.use('/api/working-slots', workingSlotRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/admin', adminRoutes); // ✅ MONTAGE ROUTES ADMIN
app.use('/api/time-change-requests', timeChangeRequestRoutes); // ✅ MONTAGE ROUTES TIME CHANGE REQUESTS
app.use('/api/notifications', notificationRoutes); // ✅ MONTAGE ROUTES NOTIFICATIONS
app.use('/api/comments', commentRoutes); // ✅ MONTAGE ROUTES COMMENTAIRES
app.use('/api/payments', paymentRoutes); // ✅ MONTAGE ROUTES PAIEMENTS STRIPE
// app.use('/api/images', imageRoutes); // Removed - simplified photo system

// Configuration pour servir les fichiers statiques avec CORS
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static('uploads'));

app.use('/', express.static('public')); // Pour servir default-avatar.png

// Error Handling
app.use(errorHandler);

// Database Connection
import connectDB from './config/database.js';

const PORT = process.env.PORT || 5000;

// Utiliser la configuration centralisée
connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  logger.error('Failed to start server:', err);
  process.exit(1);
}); 