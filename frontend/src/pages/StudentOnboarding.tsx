import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useSocket } from '../hooks/useSocket';
import { Layout } from '../components/layout/Layout';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import { validation } from '../utils/validation';
import { storage } from '../utils/storage';

export const StudentOnboarding = () => {
  const navigate = useNavigate();
  const { setStudent } = useUser();
  const { socket, isConnected } = useSocket();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameValidation = validation.validateName(name);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid name');
      return;
    }

    setIsLoading(true);

    try {
      // Generate unique student ID
      const studentId = storage.generateStudentId();

      // Store student info
      setStudent(studentId, name.trim());

      // Emit student:join socket event
      if (socket && isConnected) {
        socket.emit('student:join', {
          studentId,
          name: name.trim(),
        });
      }

      // Navigate to unified student view
      navigate('/student/view');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-2xl flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-white rounded-full text-sm font-semibold mb-8 shadow-sm">
            <span className="material-icons text-sm">auto_awesome</span>
            <span>Intervue Poll</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-medium tracking-tight mb-4">
            Let's <span className="font-bold">Get Started</span>
          </h1>

          <p className="text-gray-500 text-lg max-w-xl mb-12 leading-relaxed">
            If you're a student, you'll be able to{' '}
            <strong className="text-gray-dark font-semibold">
              submit your answers
            </strong>
            , participate in live polls, and see how your responses compare with your classmates.
          </p>

          <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col items-center">
            <div className="w-full text-left mb-10">
              <Input
                label="Enter your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                error={error || undefined}
                autoFocus
              />
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              disabled={!name.trim() || isLoading}
              className="w-full bg-gradient-to-r from-primary to-primary-light"
            >
              Continue
            </Button>
          </form>
        </div>
      </main>
    </Layout>
  );
};
