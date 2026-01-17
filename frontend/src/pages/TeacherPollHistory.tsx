import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { PollCard } from '../components/poll/PollCard';
import { PollResults } from '../components/poll/PollResults';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import api from '../services/api';
import { PollWithResults } from '../types/poll';

export const TeacherPollHistory = () => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState<PollWithResults[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const history = await api.getPollHistory();
        setPolls(history);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch poll history');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (isLoading) {
    return (
      <Layout showBackButton>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout showBackButton>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => navigate('/teacher/live')}>Back to Live View</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout showBackButton>
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">View Poll History</h1>
          <p className="text-gray-500">
            View all completed polls and their final results
          </p>
        </div>

        <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
          {polls.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No poll history available yet.
              </p>
              <Button onClick={() => navigate('/teacher/create')} className="mt-4">
                Create Your First Poll
              </Button>
            </div>
          ) : (
            polls.map((poll) => (
              <div key={poll._id} className="mb-6">
                <PollCard poll={poll}>
                  {poll.results ? (
                    <PollResults voteCounts={{ options: poll.results, totalVotes: poll.results.reduce((sum, opt) => sum + opt.votes, 0) }} />
                  ) : (
                    <p className="text-center text-gray-500 py-4">No results available</p>
                  )}
                </PollCard>
              </div>
            ))
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button onClick={() => navigate('/teacher/live')} variant="outline">
            Back to Live View
          </Button>
        </div>
      </main>
    </Layout>
  );
};
