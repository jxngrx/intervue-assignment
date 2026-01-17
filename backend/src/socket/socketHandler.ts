import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from '../types/socket';
import { setupPollSocketHandlers } from './pollSocketHandler';

export const initializeSocket = (httpServer: HttpServer): SocketServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> => {
  // Parse CORS origin from environment variable (comma-separated) or use defaults
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:3005',
        'https://poll.jxngrx.in',
        'http://poll.jxngrx.in',
      ];

  const io = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Enhanced options for mobile compatibility
    transports: ['polling', 'websocket'], // Prefer polling for better mobile support
    allowEIO3: true, // Backward compatibility
    pingTimeout: 60000, // Increased for mobile networks (60 seconds)
    pingInterval: 25000, // Ping every 25 seconds
    // Enable compression for mobile networks
    perMessageDeflate: {
      threshold: 1024, // Only compress messages larger than 1KB
    },
    // Connection timeout
    connectTimeout: 30000, // 30 seconds for mobile networks
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Setup poll-related socket handlers (includes disconnect handler)
    setupPollSocketHandlers(io, socket);
  });

  return io;
};
