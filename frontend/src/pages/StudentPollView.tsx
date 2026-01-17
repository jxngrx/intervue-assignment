import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { usePoll } from '../context/PollContext';
import { usePollTimer } from '../hooks/usePollTimer';
import { useStudentState } from '../hooks/useStudentState';
import { useSocket } from '../hooks/useSocket';
import { Layout } from '../components/layout/Layout';
import { PollCard } from '../components/poll/PollCard';
import { PollOption } from '../components/poll/PollOption';
import { Timer } from '../components/poll/Timer';
import { Button } from '../components/common/Button';
import { ToastContainer } from '../components/common/Toast';
import { ChatWidget } from '../components/common/ChatWidget';

export const StudentPollView = () => {
  const navigate = useNavigate();
  const { studentId } = useUser();
  const { activePoll, timerState, submitVote } = usePoll();
  const { state } = useStudentState(studentId);
  const { socket, isConnected } = useSocket();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const timer = usePollTimer({
    startTime: activePoll?.startTime,
    duration: activePoll?.duration || 0,
    isActive: activePoll?.status === 'active', // Timer should continue even after vote
    onComplete: () => {
      if (activePoll && !hasVoted) {
        navigate('/student/results');
      }
    },
  });

  useEffect(() => {
    // Only navigate to results if student has actually voted (not just from state)
    if (state?.hasVoted && !hasVoted) {
      setHasVoted(true);
      // Only navigate if we're not already on results page
      if (window.location.pathname !== '/student/results') {
        navigate('/student/results');
      }
    }
  }, [state, navigate, hasVoted]);

  useEffect(() => {
    // When a poll becomes active, ensure we're on the poll view if student hasn't voted
    if (activePoll && activePoll.status === 'active') {
      if (hasVoted || state?.hasVoted) {
        // Student has voted - go to results
        if (window.location.pathname !== '/student/results') {
          navigate('/student/results');
        }
      } else {
        // Poll is active and student hasn't voted - stay on poll view
        if (window.location.pathname !== '/student/poll') {
          navigate('/student/poll');
        }
      }
    }
  }, [activePoll, hasVoted, state, navigate]);

  // Request state sync when component mounts (for late-joining students)
  useEffect(() => {
    if (socket && isConnected && studentId && !activePoll) {
      socket.emit('state:request', { type: 'student', studentId });
    }
  }, [socket, isConnected, studentId, activePoll]);

  // Handle student kicked event
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleKicked = () => {
      addToast('You have been kicked out by the teacher', 'error');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    };

    socket.on('student:kicked', handleKicked);

    return () => {
      socket.off('student:kicked', handleKicked);
    };
  }, [socket, isConnected, navigate]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOptionSelect = (index: number) => {
    if (hasVoted || !activePoll || activePoll.status !== 'active') return;
    setSelectedOption(index);
  };

  const handleSubmit = async () => {
    if (!activePoll || !studentId || selectedOption === null || hasVoted) return;

    setIsSubmitting(true);

    try {
      await submitVote(activePoll._id, studentId, selectedOption);
      setHasVoted(true);
      addToast('Vote submitted successfully!', 'success');

      // Navigate to results after a short delay
      setTimeout(() => {
        navigate('/student/results');
      }, 500);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to submit vote', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activePoll) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-4">
              Wait for the teacher to ask questions..
            </p>
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (activePoll.status !== 'active') {
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
          <h2 className="text-2xl font-bold text-gray-dark">Question 1</h2>
          <Timer timerState={timerState || undefined} />
        </div>

        <PollCard poll={activePoll}>
          <div className="space-y-4">
            {activePoll.options.map((option, index) => (
              <PollOption
                key={index}
                option={option}
                index={index}
                isSelected={selectedOption === index}
                onClick={() => handleOptionSelect(index)}
                disabled={hasVoted || timer.remaining === 0}
              />
            ))}
          </div>

          <div className="px-0 pb-0 flex justify-end mt-6">
            <Button
              onClick={handleSubmit}
              disabled={selectedOption === null || hasVoted || isSubmitting || timer.remaining === 0}
              isLoading={isSubmitting}
              size="lg"
            >
              Submit
            </Button>
          </div>
        </PollCard>

        <p className="text-center mt-6 text-gray-500 dark:text-gray-400 text-sm">
          Please select the most accurate option before the timer ends.
        </p>
      </div>
    </Layout>
  );
};
