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
  const io = new SocketServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: '*', // Configure based on your frontend URL
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Setup poll-related socket handlers (includes disconnect handler)
    setupPollSocketHandlers(io, socket);
  });

  return io;
};
