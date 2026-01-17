import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

let socketInstance: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = (): Socket<ServerToClientEvents, ClientToServerEvents> => {
  if (!socketInstance) {
    console.log('🔌 Initializing Socket.io connection to:', SOCKET_URL);

    // Detect if running on mobile device
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    socketInstance = io(SOCKET_URL, {
      // For mobile, prefer polling first as it's more reliable, then upgrade to websocket
      transports: isMobile ? ['polling', 'websocket'] : ['websocket', 'polling'],
      upgrade: true, // Allow transport upgrade
      rememberUpgrade: true, // Remember transport preference
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // Increased for mobile networks
      reconnectionAttempts: Infinity,
      timeout: 30000, // Increased timeout for mobile networks (30 seconds)
      forceNew: false,
      // Additional options for mobile compatibility
      autoConnect: true,
      // Enable compression for mobile networks
      withCredentials: true,
    });

    socketInstance.on('connect', () => {
      console.log('✅ Socket.io connected:', socketInstance?.id);
      try {
        const transport = (socketInstance?.io?.engine as any)?.transport?.name;
        console.log('📡 Transport:', transport || 'unknown');
      } catch (e) {
        // Transport info not available
      }
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Socket.io disconnected:', reason);
      // On mobile, some disconnects are expected (app backgrounding, network switching)
      if (reason === 'io server disconnect') {
        // Server disconnected, reconnect manually
        socketInstance?.connect();
      }
    });

    socketInstance.on('connect_error', (error) => {
      console.error('❌ Socket.io connection error:', error.message);
      // For mobile, try to reconnect with different transport
      if (isMobile && socketInstance && !socketInstance.connected) {
        setTimeout(() => {
          if (socketInstance && !socketInstance.connected) {
            console.log('🔄 Retrying connection with polling transport...');
            socketInstance.io.opts.transports = ['polling', 'websocket'];
            socketInstance.connect();
          }
        }, 2000);
      }
    });

    // Handle transport upgrade
    socketInstance.io.on('upgrade', () => {
      try {
        const transport = (socketInstance?.io?.engine as any)?.transport?.name;
        console.log('⬆️ Transport upgraded to:', transport || 'unknown');
      } catch (e) {
        console.log('⬆️ Transport upgraded');
      }
    });

    // Handle transport errors
    socketInstance.io.on('error', (error: Error) => {
      console.error('❌ Socket.io engine error:', error);
    });
  }
  return socketInstance;
};

export const disconnectSocket = (): void => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
};

export default getSocket;
