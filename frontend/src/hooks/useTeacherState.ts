import { useState, useEffect, useCallback } from 'react';
import { TeacherState } from '../types/user';
import { useSocket } from './useSocket';
import api from '../services/api';

export const useTeacherState = () => {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<TeacherState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const teacherState = await api.getTeacherState();
      setState(teacherState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teacher state');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch state on mount
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Listen to state:sync event from socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStateSync = (syncState: TeacherState) => {
      setState(syncState);
      setError(null);
    };

    socket.on('state:sync', handleStateSync);

    // Request state sync on connection
    socket.emit('state:request', { type: 'teacher' });

    return () => {
      socket.off('state:sync', handleStateSync);
    };
  }, [socket, isConnected]);

  // Recover state on page refresh
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  return {
    state,
    isLoading,
    error,
    refetch: fetchState,
  };
};
