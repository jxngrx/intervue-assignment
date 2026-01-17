import { useState, useEffect, useCallback } from 'react';
import { Poll, VoteCounts } from '../types/poll';
import { TimerState } from '../types/socket';
import { useSocket } from './useSocket';
import api from '../services/api';

interface UsePollStateReturn {
  activePoll: Poll | null;
  voteCounts: VoteCounts | null;
  timerState: TimerState | null;
  isLoading: boolean;
  error: string | null;
  setActivePoll: (poll: Poll | null) => void;
  updateVoteCounts: (counts: VoteCounts) => void;
  updateTimerState: (state: TimerState) => void;
}

export const usePollState = (): UsePollStateReturn => {
  const { socket, isConnected } = useSocket();
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [voteCounts, setVoteCounts] = useState<VoteCounts | null>(null);
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePollCreated = (poll: Poll) => {
      setActivePoll(poll);
      setError(null);
    };

    const handlePollActivated = (data: { poll: Poll; timerState: TimerState }) => {
      // New poll activated - reset all state
      setActivePoll(data.poll);
      setTimerState(data.timerState);
      setVoteCounts(null); // Reset vote counts when new poll starts
      setError(null);
      // Note: hasVoted state is managed in StudentView component and will reset there
    };

    const handleVoteReceived = (data: { voteCounts: VoteCounts; totalVotes: number }) => {
      setVoteCounts(data.voteCounts);
    };

    const handlePollCompleted = (data: { poll: Poll; results: any }) => {
      setActivePoll(data.poll);
      setTimerState({ remaining: 0, isActive: false, elapsed: data.poll.duration, totalDuration: data.poll.duration });
      if (data.results) {
        setVoteCounts({
          options: data.results,
          totalVotes: data.results.reduce((sum: number, opt: any) => sum + opt.votes, 0),
        });
      }
    };

    const handlePollCancelled = (data: { pollId: string }) => {
      // Clear active poll when cancelled
      if (activePoll && activePoll._id === data.pollId) {
        setActivePoll(null);
        setTimerState(null);
        setVoteCounts(null);
      }
    };

    const handleTimerUpdate = (state: TimerState) => {
      setTimerState(state);
    };

    const handleError = (error: { message: string; code?: string }) => {
      setError(error.message);
    };

    socket.on('poll:created', handlePollCreated);
    socket.on('poll:activated', handlePollActivated);
    socket.on('vote:received', handleVoteReceived);
    socket.on('poll:completed', handlePollCompleted);
    socket.on('poll:cancelled', handlePollCancelled);
    socket.on('timer:update', handleTimerUpdate);
    socket.on('error', handleError);

    return () => {
      socket.off('poll:created', handlePollCreated);
      socket.off('poll:activated', handlePollActivated);
      socket.off('vote:received', handleVoteReceived);
      socket.off('poll:completed', handlePollCompleted);
      socket.off('poll:cancelled', handlePollCancelled);
      socket.off('timer:update', handleTimerUpdate);
      socket.off('error', handleError);
    };
  }, [socket, isConnected]);

  // Fetch active poll on mount
  useEffect(() => {
    const fetchActivePoll = async () => {
      setIsLoading(true);
      try {
        const poll = await api.getActivePoll();
        if (poll) {
          setActivePoll(poll);
          if (poll.results) {
            setVoteCounts({
              options: poll.results,
              totalVotes: poll.results.reduce((sum, opt) => sum + opt.votes, 0),
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch active poll');
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivePoll();
  }, []);

  const updateVoteCounts = useCallback((counts: VoteCounts) => {
    setVoteCounts(counts);
  }, []);

  const updateTimerState = useCallback((state: TimerState) => {
    setTimerState(state);
  }, []);

  return {
    activePoll,
    voteCounts,
    timerState,
    isLoading,
    error,
    setActivePoll,
    updateVoteCounts,
    updateTimerState,
  };
};
