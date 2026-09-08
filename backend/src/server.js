import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import parkingRoutes from './routes/parkingRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import verificationRoutes from './routes/verificationRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import smartRoutes from './routes/smartRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import errorMiddleware from './middleware/errorMiddleware.js';

// Load env vars
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 1. HTTP Security Headers with Helmet
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// 2. Dynamic Cross-Origin Resource Sharing (CORS)
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((url) => url.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin, configured CLIENT_URL, or any local dev port (5173, 5174, etc.)
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        allowedOrigins.includes('*') ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);

// 3. Body Parsing with Safe Payload Size Limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// 4. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 5. Rate Limiting — DDoS and Brute Force Protection
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600, // Limit each IP to 600 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
});
app.use('/api', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60, // Limit auth attempts to 60 per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ParkShare API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/parking', parkingRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/verifications', verificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/smart', smartRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Error handler (must be last)
app.use(errorMiddleware);

// Start server
const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 ParkShare API running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();
