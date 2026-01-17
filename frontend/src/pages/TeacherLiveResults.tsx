import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { usePoll } from '../context/PollContext';
import { useTeacherState } from '../hooks/useTeacherState';
import { useSocket } from '../hooks/useSocket';
import { useUser } from '../context/UserContext';
import { Layout } from '../components/layout/Layout';
import { PollCard } from '../components/poll/PollCard';
import { PollResults } from '../components/poll/PollResults';
import { Timer } from '../components/poll/Timer';
import { Button } from '../components/common/Button';
import { ChatModal } from '../components/common/ChatModal';
import { ToastContainer } from '../components/common/Toast';
import api from '../services/api';

export const TeacherLiveResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { activePoll, voteCounts, timerState, activatePoll, refreshActivePoll } = usePoll();
  const { state } = useTeacherState();
  const { socket, isConnected } = useSocket();
  const { clearUser } = useUser();
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>>([]);
  const [participants, setParticipants] = useState<Array<{ studentId: string; name: string }>>([]);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; studentId: string; name: string; message: string; timestamp: Date }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [lastCompletedPoll, setLastCompletedPoll] = useState<any>(null);
  const [pollCount, setPollCount] = useState(0); // Track number of polls in this session

  const displayPoll = activePoll || state?.activePoll || lastCompletedPoll;
  const displayVoteCounts = voteCounts || state?.voteCounts;
  const displayTimerState = timerState || state?.timerState;
  const canCreateNewPoll = state?.canCreateNewPoll ?? false;

  // Check if poll can be created: use backend state or local check
  const allStudentsVoted = displayPoll && displayVoteCounts && participants.length > 0 &&
    displayVoteCounts.totalVotes >= participants.length;
  const timeEnded = displayTimerState && !displayTimerState.isActive && displayTimerState.remaining === 0;
  const canCreatePoll = canCreateNewPoll || (!displayPoll || displayPoll.status === 'completed' || allStudentsVoted || timeEnded);

  // Set teacher role and listen to participants/chat
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('teacher:set');

      const handleParticipantsUpdate = (participantsList: Array<{ studentId: string; name: string }>) => {
        console.log('📋 Participants updated:', participantsList.length);
        setParticipants(participantsList);
      };

      const handleChatMessage = (data: { studentId: string; name: string; message: string; timestamp: Date }) => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            ...data,
            timestamp: new Date(data.timestamp),
          },
        ]);
      };

      socket.on('participants:update', handleParticipantsUpdate);
      socket.on('chat:message', handleChatMessage);

      // Request participants list on mount and when socket reconnects
      // Add a small delay to ensure teacher:set has been processed
      const timeout = setTimeout(() => {
        socket.emit('participants:request');
      }, 200);

      return () => {
        clearTimeout(timeout);
        socket.off('participants:update', handleParticipantsUpdate);
        socket.off('chat:message', handleChatMessage);
      };
    }
  }, [socket, isConnected]);

  // Re-request participants when component mounts or socket reconnects
  useEffect(() => {
    if (socket && isConnected) {
      // Small delay to ensure teacher:set has been processed
      const timeout = setTimeout(() => {
        socket.emit('participants:request');
      }, 100);

      return () => clearTimeout(timeout);
    }
  }, [socket, isConnected]);

  // Request participants when page becomes visible (tab switch back) or when navigating back to this route
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socket && isConnected) {
        // Request participants when tab becomes visible
        socket.emit('participants:request');
      }
    };

    const handleFocus = () => {
      if (socket && isConnected) {
        // Request participants when window regains focus
        socket.emit('participants:request');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [socket, isConnected]);

  // Request participants when navigating back to this route
  useEffect(() => {
    if (location.pathname === '/teacher/live' && socket && isConnected) {
      // Small delay to ensure everything is set up
      const timeout = setTimeout(() => {
        socket.emit('participants:request');
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [location.pathname, socket, isConnected]);

  useEffect(() => {
    // Refresh poll data periodically
    const interval = setInterval(() => {
      refreshActivePoll();
    }, 2000);

    return () => clearInterval(interval);
  }, [refreshActivePoll]);

  // Fetch last completed poll when no active poll and track poll count
  useEffect(() => {
    const fetchLastPoll = async () => {
      if (!displayPoll) {
        try {
          const history = await api.getPollHistory();
          if (history.length > 0) {
            setLastCompletedPoll(history[0]); // Get most recent completed poll
            // Count completed polls for question numbering
            setPollCount(history.length);
          }
        } catch (err) {
          console.error('Failed to fetch poll history:', err);
        }
      } else {
        setLastCompletedPoll(null);
        // If there's an active poll, count completed polls + 1 for current
        if (displayPoll.status === 'active' || displayPoll.status === 'pending') {
          api.getPollHistory().then(history => {
            setPollCount(history.length + 1);
          }).catch(() => {
            setPollCount(1);
          });
        } else if (displayPoll.status === 'completed') {
          api.getPollHistory().then(history => {
            setPollCount(history.length);
          }).catch(() => {
            setPollCount(1);
          });
        }
      }
    };

    fetchLastPoll();
  }, [displayPoll]);

  // Track poll count when new poll is created or completed
  useEffect(() => {
    if (socket && isConnected) {
      const handlePollCreated = () => {
        api.getPollHistory().then(history => {
          setPollCount(history.length + 1);
        });
      };

      const handlePollCompleted = () => {
        api.getPollHistory().then(history => {
          setPollCount(history.length);
        });
      };

      socket.on('poll:created', handlePollCreated);
      socket.on('poll:completed', handlePollCompleted);

      return () => {
        socket.off('poll:created', handlePollCreated);
        socket.off('poll:completed', handlePollCompleted);
      };
    }
  }, [socket, isConnected]);

  // Fetch results for completed poll if not available
  useEffect(() => {
    const fetchCompletedPollResults = async () => {
      if (displayPoll && displayPoll.status === 'completed' && !displayVoteCounts) {
        try {
          const pollWithResults = await api.getPollResults(displayPoll._id);
          // Update vote counts if available
          if (pollWithResults.results) {
            // This will be handled by the state sync
          }
        } catch (err) {
          console.error('Failed to fetch poll results:', err);
        }
      }
    };

    fetchCompletedPollResults();
  }, [displayPoll, displayVoteCounts]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAskNewQuestion = () => {
    navigate('/teacher/create');
  };

  const handleViewHistory = async () => {
    navigate('/teacher/history');
  };

  const handleActivatePoll = async () => {
    if (!displayPoll) return;

    try {
      await activatePoll(displayPoll._id);
      addToast('Poll activated!', 'success');
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to activate poll', 'error');
    }
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !socket || !isConnected) return;
    // Teachers can send messages too (using a special identifier)
    socket.emit('chat:send', {
      studentId: 'teacher',
      name: 'Teacher',
      message: chatInput.trim(),
    });
    setChatInput('');
  };

  const handleKickOut = (studentId: string) => {
    if (!socket || !isConnected) return;
    socket.emit('student:kick', { studentId });
    addToast(`Student ${participants.find(p => p.studentId === studentId)?.name || 'unknown'} has been kicked out`, 'info');
  };


  const handleLogout = () => {
    if (!socket || !isConnected) {
      // If socket not connected, just clear and refresh
      clearUser();
      window.location.href = '/';
      return;
    }

    if (window.confirm('Are you sure you want to end the session? All students will be disconnected.')) {
      socket.emit('teacher:logout');
      clearUser();
      // Force full page refresh to clear all state
      window.location.href = '/';
    }
  };

  // If no poll at all, show empty state
  if (!displayPoll) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-gray-500 mb-4">
              No polls yet. Create your first poll to get started.
            </p>
            <Button onClick={handleAskNewQuestion} size="lg">
              <span className="material-icons mr-2 align-middle">add</span>
              Create New Poll
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[80vh] relative">
        <div className="w-full max-w-4xl space-y-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold">Question {pollCount || 1}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="material-icons text-base">people</span>
                <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {displayPoll.status === 'active' && (
                <Timer timerState={displayTimerState || null} />
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="!border-red-500 !text-red-500 hover:!bg-red-50"
              >
                <span className="material-icons mr-2 align-middle text-base">logout</span>
                Logout
              </Button>
            </div>
          </div>

          <PollCard poll={displayPoll}>
            {displayVoteCounts ? (
              <PollResults voteCounts={displayVoteCounts} />
            ) : displayPoll.status === 'completed' ? (
              <div className="text-center py-8 text-gray-500">
                Poll completed. Fetching results...
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Waiting for votes...
              </div>
            )}
          </PollCard>

          <div className="flex justify-end gap-4 mt-8">
            {displayPoll.status === 'pending' && (
              <Button onClick={handleActivatePoll} size="lg">
                Activate Poll
              </Button>
            )}
            {(canCreatePoll || displayPoll.status === 'completed') && (
              <Button onClick={handleAskNewQuestion} size="lg">
                <span className="material-icons mr-2 align-middle">add</span>
                Create New Poll
              </Button>
            )}
          </div>
        </div>

        {/* Chat Button */}
        <button
          onClick={() => setIsChatModalOpen(true)}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
        >
          <span className="material-icons">chat_bubble_outline</span>
        </button>

        {/* Chat Modal */}
        <ChatModal
          isOpen={isChatModalOpen}
          onClose={() => setIsChatModalOpen(false)}
          participants={participants}
          chatMessages={chatMessages}
          chatInput={chatInput}
          onChatInputChange={setChatInput}
          onSendChat={handleSendChat}
          onKickOut={handleKickOut}
        />

        <div className="mt-8">
          <Button onClick={handleViewHistory} variant="outline">
            <span className="material-icons mr-2 align-middle">visibility</span>
            View Poll history
          </Button>
        </div>
      </main>
    </Layout>
  );
};
