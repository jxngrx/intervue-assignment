import { useState } from 'react';
import { usePoll } from '../context/PollContext';
import { useStudentState } from '../hooks/useStudentState';
import { useUser } from '../context/UserContext';
import { Layout } from '../components/layout/Layout';
import { PollCard } from '../components/poll/PollCard';
import { PollResults } from '../components/poll/PollResults';
import { Timer } from '../components/poll/Timer';
import { ChatWidget } from '../components/common/ChatWidget';

export const StudentResults = () => {
  const { activePoll, voteCounts } = usePoll();
  const { studentId } = useUser();
  const { state } = useStudentState(studentId);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Determine which poll and results to show
  const displayPoll = activePoll || state?.activePoll;
  const displayVoteCounts = voteCounts || state?.voteCounts;

  if (!displayPoll || !displayVoteCounts) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative mx-auto w-12 h-12">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
            <p className="text-gray-600 font-medium text-center">
              Wait for the teacher to ask a new question..
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // Find which option the student voted for (if available)
  // This would need to be tracked separately or retrieved from state
  const selectedOptionIndex = undefined;

  return (
    <Layout>
      <ChatWidget isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />

      <div className="w-full max-w-2xl mx-auto p-4">
        <div className="flex items-center justify-center gap-4 mb-6">
          <h2 className="text-lg font-bold">Question 1</h2>
          <Timer timerState={state?.timerState || null} />
        </div>

        <PollCard poll={displayPoll}>
          <PollResults voteCounts={displayVoteCounts} selectedOptionIndex={selectedOptionIndex} />
        </PollCard>

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
      </div>
    </Layout>
  );
};
