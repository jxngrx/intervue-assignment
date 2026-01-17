import express, { Express, Request, Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import apiRoutes from './routes';
import { initializeSocket } from './socket/socketHandler';
import connectDatabase from './config/database';
import TimerService from './services/TimerService';

// Load environment variables
dotenv.config();

const app: Express = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3005;

// Initialize Socket.io
const io = initializeSocket(httpServer);

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3005'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})); // Enable CORS
app.use(morgan('dev')); // Logging
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Health check route
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api', apiRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Connect to database and start server after connection
connectDatabase()
  .then(() => {
    // Start server only after database connection is established
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.io server initialized`);
    });

    // Periodic check for expired polls (every 5 seconds)
    // Only start after database is connected
    setInterval(async () => {
      try {
        // Check if mongoose is connected before running query
        if (mongoose.connection.readyState === 1) {
          await TimerService.checkAndCompleteExpiredPolls();
        } else {
          console.warn('⚠️ MongoDB not connected, skipping expired polls check');
        }
      } catch (error) {
        console.error('Error checking expired polls:', error);
      }
    }, 5000);
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
    // Still start server but without database-dependent features
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT} (without database)`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔌 Socket.io server initialized`);
      console.warn('⚠️ Running without database connection - some features may not work');
    });
  });

export { app, io };
export default app;
