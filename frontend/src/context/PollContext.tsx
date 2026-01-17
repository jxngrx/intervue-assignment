import { createContext, useContext, ReactNode } from 'react';
import { Poll, VoteCounts, CreatePollData } from '../types/poll';
import { TimerState } from '../types/socket';
import { usePollState } from '../hooks/usePollState';
import { useSocket } from '../hooks/useSocket';
import api from '../services/api';

interface PollContextType {
  activePoll: Poll | null;
  voteCounts: VoteCounts | null;
  timerState: TimerState | null;
  isLoading: boolean;
  error: string | null;
  createPoll: (data: CreatePollData) => Promise<void>;
  activatePoll: (pollId: string) => Promise<void>;
  submitVote: (pollId: string, studentId: string, optionIndex: number) => Promise<void>;
  refreshActivePoll: () => Promise<void>;
}

const PollContext = createContext<PollContextType | undefined>(undefined);

export const PollProvider = ({ children }: { children: ReactNode }) => {
  const {
    activePoll,
    voteCounts,
    timerState,
    isLoading,
    error,
    setActivePoll,
    updateVoteCounts,
  } = usePollState();
  const { socket, isConnected } = useSocket();

  const createPoll = async (data: CreatePollData) => {
    if (!socket) {
      throw new Error('Socket not initialized. Please wait for connection...');
    }

    // Wait for connection if not connected yet
    if (!isConnected) {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout. Please check if the backend server is running.'));
        }, 5000);

        const checkConnection = () => {
          if (socket.connected) {
            clearTimeout(timeout);
            socket.emit('poll:create', data);
            resolve();
          } else {
            socket.once('connect', () => {
              clearTimeout(timeout);
              socket.emit('poll:create', data);
              resolve();
            });
          }
        };

        if (socket.connected) {
          checkConnection();
        } else {
          socket.once('connect', checkConnection);
        }
      });
    }

    socket.emit('poll:create', data);
  };

  const activatePoll = async (pollId: string) => {
    if (!socket) {
      throw new Error('Socket not initialized. Please wait for connection...');
    }

    // Wait for connection if not connected yet
    if (!isConnected) {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout. Please check if the backend server is running.'));
        }, 5000);

        const checkConnection = () => {
          if (socket.connected) {
            clearTimeout(timeout);
            socket.emit('poll:activate', pollId);
            resolve();
          } else {
            socket.once('connect', () => {
              clearTimeout(timeout);
              socket.emit('poll:activate', pollId);
              resolve();
            });
          }
        };

        if (socket.connected) {
          checkConnection();
        } else {
          socket.once('connect', checkConnection);
        }
      });
    }

    socket.emit('poll:activate', pollId);
  };

  const submitVote = async (pollId: string, studentId: string, optionIndex: number) => {
    if (!socket) {
      throw new Error('Socket not initialized. Please wait for connection...');
    }

    // Wait for connection if not connected yet
    if (!isConnected) {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Socket connection timeout. Please check if the backend server is running.'));
        }, 5000);

        const checkConnection = () => {
          if (socket.connected) {
            clearTimeout(timeout);
            socket.emit('vote:submit', { pollId, studentId, optionIndex });
            resolve();
          } else {
            socket.once('connect', () => {
              clearTimeout(timeout);
              socket.emit('vote:submit', { pollId, studentId, optionIndex });
              resolve();
            });
          }
        };

        if (socket.connected) {
          checkConnection();
        } else {
          socket.once('connect', checkConnection);
        }
      });
    }

    socket.emit('vote:submit', { pollId, studentId, optionIndex });
  };

  const refreshActivePoll = async () => {
    try {
      const poll = await api.getActivePoll();
      if (poll) {
        setActivePoll(poll);
        if (poll.results) {
          updateVoteCounts({
            options: poll.results,
            totalVotes: poll.results.reduce((sum, opt) => sum + opt.votes, 0),
          });
        }
      } else {
        setActivePoll(null);
      }
    } catch (err) {
      console.error('Failed to refresh active poll:', err);
    }
  };

  return (
    <PollContext.Provider
      value={{
        activePoll,
        voteCounts,
        timerState,
        isLoading,
        error,
        createPoll,
        activatePoll,
        submitVote,
        refreshActivePoll,
      }}
    >
      {children}
    </PollContext.Provider>
  );
};

export const usePoll = () => {
  const context = useContext(PollContext);
  if (context === undefined) {
    throw new Error('usePoll must be used within a PollProvider');
  }
  return context;
};
