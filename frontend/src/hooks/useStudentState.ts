import { useState, useEffect, useCallback } from 'react';
import { StudentState } from '../types/user';
import { useSocket } from './useSocket';
import api from '../services/api';
import { storage } from '../utils/storage';

export const useStudentState = (studentId: string | null) => {
  const { socket, isConnected } = useSocket();
  const [state, setState] = useState<StudentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    if (!studentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const studentState = await api.getStudentState(studentId);
      setState(studentState);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch student state');
    } finally {
      setIsLoading(false);
    }
  }, [studentId]);

  // Fetch state on mount and when studentId changes
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // Listen to state:sync event from socket
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleStateSync = (syncState: StudentState) => {
      setState(syncState);
      setError(null);
    };

    socket.on('state:sync', handleStateSync);

    // Request state sync on connection
    if (studentId) {
      socket.emit('state:request', { type: 'student', studentId });
    }

    return () => {
      socket.off('state:sync', handleStateSync);
    };
  }, [socket, isConnected, studentId]);

  // Recover state on page refresh
  useEffect(() => {
    const recoverState = async () => {
      const savedStudentId = storage.getStudentId();
      if (savedStudentId && savedStudentId === studentId) {
        await fetchState();
      }
    };

    recoverState();
  }, [studentId, fetchState]);

  return {
    state,
    isLoading,
    error,
    refetch: fetchState,
  };
};
