import { useEffect, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import getSocket, { disconnectSocket } from '../services/socket';
import { ClientToServerEvents, ServerToClientEvents } from '../types/socket';

export const useSocket = () => {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socketInstance = getSocket();

    // Check if already connected
    if (socketInstance.connected) {
      setIsConnected(true);
      setError(null);
    }

    const onConnect = () => {
      setIsConnected(true);
      setError(null);
      console.log('✅ Socket connected');
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log('❌ Socket disconnected:', reason);
    };

    const onError = (err: Error) => {
      setError(err.message || 'Connection error');
      setIsConnected(false);
      console.error('Socket error:', err);
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);
    socketInstance.on('connect_error', onError);

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.off('connect_error', onError);
    };
  }, []);

  const disconnect = useCallback(() => {
    if (socket) {
      disconnectSocket();
      setSocket(null);
      setIsConnected(false);
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    error,
    disconnect,
  };
};
