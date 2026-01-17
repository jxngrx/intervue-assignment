import { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { usePoll } from '../context/PollContext';
import { usePollTimer } from '../hooks/usePollTimer';
import { useStudentState } from '../hooks/useStudentState';
import { useSocket } from '../hooks/useSocket';
import { Layout } from '../components/layout/Layout';
import { PollCard } from '../components/poll/PollCard';
import { PollOption } from '../components/poll/PollOption';
import { PollResults } from '../components/poll/PollResults';
import { Timer } from '../components/poll/Timer';
import { Button } from '../components/common/Button';
import { ToastContainer } from '../components/common/Toast';
import { ChatWidget } from '../components/common/ChatWidget';

export const StudentView = () => {
  const { studentId, clearUser } = useUser();
  const { activePoll, voteCounts, timerState, submitVote } = usePoll();
  const { state } = useStudentState(studentId);
  const { socket, isConnected } = useSocket();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentPollId, setCurrentPollId] = useState<string | null>(null);
  const [pollCount, setPollCount] = useState(1); // Track number of polls seen, start at 1

  // Use poll from context or state
  const displayPoll = activePoll || state?.activePoll;

  // Initialize poll count when first poll is seen
  useEffect(() => {
    if (displayPoll && !currentPollId) {
      setCurrentPollId(displayPoll._id);
      setPollCount(1);
    }
  }, [displayPoll, currentPollId]);
  const displayVoteCounts = voteCounts || state?.voteCounts;
  const displayTimerState = timerState || state?.timerState;

  // Timer should continue based on poll status, not vote status
  usePollTimer({
    startTime: displayPoll?.startTime,
    duration: displayPoll?.duration || 0,
    isActive: displayPoll?.status === 'active', // Timer continues even after vote
    onComplete: () => {
      // Timer completed - poll time expired
      // State will update automatically via socket events
    },
  });

  // Reset hasVoted when new poll is activated
  useEffect(() => {
    if (displayPoll) {
      const pollId = displayPoll._id;

      // If poll changed, reset voting state
      if (currentPollId !== pollId) {
        setCurrentPollId(pollId);
        setHasVoted(false);
        setSelectedOption(null);
      }
    }
  }, [displayPoll?._id, currentPollId]);

  // Update hasVoted from state (only if poll matches)
  useEffect(() => {
    if (state?.hasVoted !== undefined && state?.activePoll?._id === displayPoll?._id) {
      setHasVoted(state.hasVoted);
    }
  }, [state?.hasVoted, state?.activePoll?._id, displayPoll?._id]);

  // Request state sync when component mounts (for late-joining students)
  useEffect(() => {
    if (socket && isConnected && studentId && !displayPoll) {
      socket.emit('state:request', { type: 'student', studentId });
    }
  }, [socket, isConnected, studentId, displayPoll]);

  // Handle student kicked event
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleKicked = () => {
      addToast('You have been kicked out by the teacher', 'error');
      clearUser();
      // Redirect to home after delay with full refresh
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    };

    socket.on('student:kicked', handleKicked);

    return () => {
      socket.off('student:kicked', handleKicked);
    };
  }, [socket, isConnected]);

  // Listen for new poll activation to reset state
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handlePollActivated = (data: { poll: any; timerState: any }) => {
      // New poll activated - reset voting state
      if (data.poll && data.poll._id !== currentPollId) {
        setHasVoted(false);
        setSelectedOption(null);
        setCurrentPollId(data.poll._id);
        setPollCount(prev => prev + 1); // Increment poll count for new poll
      }
    };

    const handlePollCancelled = (data: { pollId: string }) => {
      // Poll cancelled - preserve vote status, just clear selection and poll ID
      if (displayPoll && displayPoll._id === data.pollId) {
        // Don't reset hasVoted - preserve whether student already voted
        setSelectedOption(null);
        setCurrentPollId(null);
        addToast('Poll was cancelled by the teacher', 'info');
      }
    };

    socket.on('poll:activated', handlePollActivated);
    socket.on('poll:cancelled', handlePollCancelled);

    return () => {
      socket.off('poll:activated', handlePollActivated);
      socket.off('poll:cancelled', handlePollCancelled);
    };
  }, [socket, isConnected, currentPollId, displayPoll]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOptionSelect = (index: number) => {
    if (hasVoted || !displayPoll || displayPoll.status !== 'active') return;
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    if (!displayPoll || !studentId || selectedOption === null || hasVoted) return;

    // Prevent voting on cancelled polls
    if (displayPoll.status === 'cancelled') {
      addToast('This poll has been cancelled', 'error');
      return;
    }

    // Prevent voting on non-active polls
    if (displayPoll.status !== 'active') {
      addToast('This poll is not active', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      await submitVote(displayPoll._id, studentId, selectedOption);
      setHasVoted(true);
      addToast('Vote submitted successfully!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to submit vote', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine which view to show
  const showPollForm = displayPoll && displayPoll.status === 'active' && !hasVoted;
  // Show results if: poll completed OR student has voted (even if poll still active)
  const showResults = displayPoll && ((hasVoted && displayPoll.status === 'active') || displayPoll.status === 'completed');
  // Show waiting/cancelled state if: no poll OR poll cancelled (but preserve hasVoted state)
  const showWaiting = !displayPoll || (displayPoll.status === 'cancelled' && !hasVoted);

  // Waiting state - no active poll or poll cancelled
  if (showWaiting) {
    const isCancelled = displayPoll?.status === 'cancelled';
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              {isCancelled ? 'Poll was cancelled by the teacher.' : 'Wait for the teacher to ask questions..'}
            </p>
            {!isCancelled && (
              <div className="relative">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Poll cancelled - show different message based on whether student voted
  if (displayPoll.status === 'cancelled') {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Poll was cancelled by the teacher.
            </p>
            {hasVoted ? (
              <p className="text-gray-400 text-sm">
                Your vote was recorded before the poll was cancelled. Wait for the teacher to ask a new question..
              </p>
            ) : (
              <p className="text-gray-400 text-sm">
                Wait for the teacher to ask a new question..
              </p>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Poll not active yet
  if (displayPoll.status !== 'active' && !hasVoted) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400">
              Wait for the teacher to ask questions..
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <ChatWidget isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />

      <div className="w-full max-w-2xl mx-auto p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-6 px-2">
          <h2 className="text-2xl font-bold text-gray-dark">Question {pollCount || 1}</h2>
          <Timer timerState={displayTimerState ?? null} />
        </div>

        <PollCard poll={displayPoll}>
          {showPollForm ? (
            // Poll Submission Form
            <>
              <div className="space-y-4">
                {displayPoll.options.map((option, index) => (
                  <PollOption
                    key={index}
                    option={option}
                    index={index}
                    isSelected={selectedOption === index}
                    onClick={() => handleOptionSelect(index)}
                    disabled={hasVoted || (displayTimerState?.remaining || 0) === 0}
                  />
                ))}
              </div>

              <div className="px-0 pb-0 flex justify-end mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={selectedOption === null || hasVoted || isSubmitting || (displayTimerState?.remaining || 0) === 0}
                  isLoading={isSubmitting}
                  size="lg"
                >
                  Submit
                </Button>
              </div>
            </>
          ) : showResults ? (
            // Results View - show after student votes or when poll is completed
            <>
              {hasVoted && displayPoll.status === 'active' ? (
                // Show selected option confirmation while poll is still active
                <div className="space-y-4">
                  <div className="bg-primary/10 border-2 border-primary rounded-xl p-4">
                    <p className="text-sm font-semibold text-primary mb-2">Your Submission</p>
                    <p className="text-base">{displayPoll.options[selectedOption || 0]?.text || 'Selected option'}</p>
                  </div>
                  <div className="text-center py-4 text-gray-500 text-sm">
                    Waiting for other students to vote...
                  </div>
                </div>
              ) : displayVoteCounts ? (
                <PollResults voteCounts={displayVoteCounts} />
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Loading results...
                </div>
              )}

              {displayPoll.status === 'completed' && (
                <div className="mt-12 flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 font-medium text-center">
                    Wait for the teacher to ask a new question..
                  </p>
                </div>
              )}
            </>
          ) : null}
        </PollCard>

        {showPollForm && (
          <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
            Please select the most accurate option before the timer ends.
          </p>
        )}
      </div>
    </Layout>
  );
};
