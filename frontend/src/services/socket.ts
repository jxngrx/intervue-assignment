import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../config/constants';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

// Global toast function - will be set by App initialization
let globalToast: ((message: string, type?: 'success' | 'error' | 'info') => void) | null = null;

export const setGlobalToast = (toastFn: (message: string, type?: 'success' | 'error' | 'info') => void) => {
  globalToast = toastFn;
};

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
            const errorMsg = typeof error === 'string' ? error : error.message || 'Unknown engine error';
            console.error('❌ Socket.io engine error:', errorMsg);
            if (globalToast) {
              globalToast(`Engine Error: ${errorMsg}`, 'error');
            }
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
      // Extract all possible error information
      const errorMessage = error.message || 'Unknown connection error';
      const errorObj = error as any;
      const errorType = errorObj.type || errorObj.name || 'Unknown';
      const errorDescription = errorObj.description || '';
      const errorCode = errorObj.code || '';
      const errorContext = errorObj.context || '';

      // Handle Event objects properly (they can't be stringified directly)
      let eventInfo = '';
      if (errorObj.event) {
        const event = errorObj.event;
        eventInfo = `Event Type: ${event.type || 'unknown'}\nEvent Target: ${event.target ? (event.target.constructor?.name || 'unknown') : 'none'}\nReadyState: ${event.target?.readyState || 'N/A'}\nURL: ${event.target?.url || 'N/A'}`;
      }

      // Try to extract useful info from error object
      let errorDetails = '';
      try {
        // Create a clean object without Event objects
        const cleanError: any = {
          message: errorMessage,
          type: errorType,
          code: errorCode,
          description: errorDescription,
          context: errorContext,
        };

        // Add stack trace if available
        if (errorObj.stack) {
          cleanError.stack = errorObj.stack;
        }

        // Add any other enumerable properties
        for (const key in errorObj) {
          if (key !== 'event' && typeof errorObj[key] !== 'object') {
            cleanError[key] = errorObj[key];
          }
        }

        errorDetails = JSON.stringify(cleanError, null, 2);
      } catch (e) {
        errorDetails = `Error: ${errorMessage}\nType: ${errorType}`;
      }

      console.error('❌ Socket.io connection error:', errorMessage);
      console.error('Error type:', errorType);
      console.error('Error code:', errorCode);
      console.error('Error description:', errorDescription);
      console.error('Error context:', errorContext);
      console.error('Event info:', eventInfo);
      console.error('Full error object:', errorObj);

      // Build comprehensive error message for mobile
      let fullErrorMsg = `Connection Error\n\nMessage: ${errorMessage}`;
      if (errorType && errorType !== 'Unknown') {
        fullErrorMsg += `\nType: ${errorType}`;
      }
      if (errorCode) {
        fullErrorMsg += `\nCode: ${errorCode}`;
      }
      if (errorDescription) {
        fullErrorMsg += `\nDescription: ${errorDescription}`;
      }
      if (eventInfo) {
        fullErrorMsg += `\n\n${eventInfo}`;
      }
      if (errorContext) {
        fullErrorMsg += `\nContext: ${errorContext}`;
      }

      // Add stack trace (first few lines only for mobile)
      if (errorObj.stack) {
        const stackLines = errorObj.stack.split('\n').slice(0, 3).join('\n');
        fullErrorMsg += `\n\nStack:\n${stackLines}`;
      }

      if (globalToast) {
        globalToast(fullErrorMsg, 'error');
      }

      // Handle websocket errors - try polling instead
      if (errorMessage.includes('websocket error') || errorMessage.includes('WebSocket') || (errorType === 'TransportError' && errorMessage.includes('websocket'))) {
        const wsErrorMsg = `WebSocket Error Detected!\n\nError: ${errorMessage}\nType: ${errorType}${errorCode ? `\nCode: ${errorCode}` : ''}\n\nRetrying with Polling transport...`;
        if (globalToast) {
          globalToast(wsErrorMsg, 'error');
        }
        console.log('🔄 WebSocket error detected, retrying with polling only...');
        if (socketInstance && !socketInstance.connected) {
          // Try polling only as fallback
          socketInstance.io.opts.transports = ['polling'];
          setTimeout(() => {
            if (socketInstance && !socketInstance.connected) {
              socketInstance.connect();
            }
          }, 1000);
        }
        return;
      }

      // Handle XHR polling errors specifically
      if (errorMessage.includes('xhr poll error') || errorMessage.includes('polling') || errorMessage.includes('XHR') || (errorType === 'TransportError' && errorMessage.includes('poll'))) {
        const pollErrorMsg = `XHR Polling Error Detected!\n\nError: ${errorMessage}\nType: ${errorType}${errorCode ? `\nCode: ${errorCode}` : ''}\n\nRetrying with WebSocket transport...`;
        if (globalToast) {
          globalToast(pollErrorMsg, 'error');
        }
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
        const retryMsg = `Mobile Connection Issue\n\nError: ${errorMessage}\nType: ${errorType}\n\nRetrying with polling transport...`;
        if (globalToast) {
          globalToast(retryMsg, 'info');
        }
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
