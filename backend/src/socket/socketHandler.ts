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
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Setup poll-related socket handlers (includes disconnect handler)
    setupPollSocketHandlers(io, socket);
  });

  return io;
};
