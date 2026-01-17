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
      rememberUpgrade: false, // Don't remember upgrade on mobile to allow fallback
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000, // Increased for mobile networks
      reconnectionAttempts: Infinity,
      timeout: 45000, // Increased timeout for mobile networks (45 seconds)
      forceNew: false,
      // Additional options for mobile compatibility
      autoConnect: true,
      // Enable compression for mobile networks
      withCredentials: true,
      // Polling-specific options for mobile
      polling: {
        extraHeaders: {},
      },
    });

    socketInstance.on('connect', () => {
      const currentSocket = socketInstance;
      if (!currentSocket) return;

      console.log('✅ Socket.io connected:', currentSocket.id);
      try {
        const transport = (currentSocket.io?.engine as any)?.transport?.name;
        console.log('📡 Transport:', transport || 'unknown');

        // Set up engine event listeners after connection
        if (currentSocket.io.engine) {
          currentSocket.io.engine.on('upgrade', () => {
            try {
              const upgradedTransport = (currentSocket?.io?.engine as any)?.transport?.name;
              console.log('⬆️ Transport upgraded to:', upgradedTransport || 'unknown');
            } catch (e) {
              console.log('⬆️ Transport upgraded');
            }
          });

          currentSocket.io.engine.on('error', (error: string | Error) => {
            console.error('❌ Socket.io engine error:', error);
          });
        }
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

      // Handle XHR polling errors specifically
      if (error.message.includes('xhr poll error') || error.message.includes('polling')) {
        console.log('🔄 XHR polling error detected, retrying with websocket only...');
        if (socketInstance && !socketInstance.connected) {
          // Try websocket only as fallback
          socketInstance.io.opts.transports = ['websocket'];
          setTimeout(() => {
            if (socketInstance && !socketInstance.connected) {
              socketInstance.connect();
            }
          }, 1000);
        }
        return;
      }

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
