import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePoll } from '../context/PollContext';
import { useSocket } from '../hooks/useSocket';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/common/Button';
import { POLL_CONFIG } from '../config/constants';
import { validation } from '../utils/validation';
import { ToastContainer } from '../components/common/Toast';

export const TeacherCreatePoll = () => {
  const navigate = useNavigate();
  const { createPoll, error } = usePoll();
  const { socket, isConnected } = useSocket();
  const [question, setQuestion] = useState('');

  // Set teacher role when component mounts
  useEffect(() => {
    if (socket && isConnected) {
      socket.emit('teacher:set');
    }
  }, [socket, isConnected]);
  const [options, setOptions] = useState<string[]>(['', '']);
  const [duration, setDuration] = useState<number>(POLL_CONFIG.DEFAULT_DURATION);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: 'success' | 'error' | 'info' }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (error) {
      addToast(error, 'error');
    }
  }, [error]);

  const handleAddOption = () => {
    if (options.length < POLL_CONFIG.MAX_OPTIONS) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > POLL_CONFIG.MIN_OPTIONS) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate
    const questionValidation = validation.validateQuestion(question);
    if (!questionValidation.valid) {
      addToast(questionValidation.error || 'Invalid question', 'error');
      setIsSubmitting(false);
      return;
    }

    const validOptions = options.filter((opt) => opt.trim().length > 0);
    const optionsValidation = validation.validateOptions(validOptions);
    if (!optionsValidation.valid) {
      addToast(optionsValidation.error || 'Invalid options', 'error');
      setIsSubmitting(false);
      return;
    }

    const durationValidation = validation.validateDuration(duration);
    if (!durationValidation.valid) {
      addToast(durationValidation.error || 'Invalid duration', 'error');
      setIsSubmitting(false);
      return;
    }

    try {
      await createPoll({
        question: question.trim(),
        options: validOptions.map((opt) => opt.trim()),
        duration,
      });

      addToast('Poll created successfully!', 'success');

      // Navigate to live results after a short delay
      setTimeout(() => {
        navigate('/teacher/live');
      }, 1000);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to create poll', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      <main className="flex-grow flex flex-col max-w-4xl mx-auto w-full px-6 py-8">
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-3 tracking-tight">
            Let's <span className="text-primary">Get Started</span>
          </h1>
          <p className="text-gray-500 max-w-xl leading-relaxed">
            You'll have the ability to create and manage polls, ask questions, and monitor your
            students' responses in real-time.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-end">
              <label className="text-sm font-semibold text-gray-dark">Enter your question</label>
              <div className="relative">
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="appearance-none bg-gray-light border-none text-xs font-medium px-4 py-2 pr-8 rounded-lg cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {POLL_CONFIG.DURATION_OPTIONS.map((dur) => (
                    <option key={dur} value={dur}>
                      {dur} seconds
                    </option>
                  ))}
                </select>
                <span className="material-icons absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-sm">
                  expand_more
                </span>
              </div>
            </div>
            <div className="relative group">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full h-32 bg-gray-light border-none rounded-xl p-6 text-lg focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-gray-400"
                placeholder="Type your question here..."
                maxLength={200}
              />
              <span className="absolute bottom-4 right-6 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                {question.length}/200
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_200px] gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-dark">Edit Options</h3>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary text-white rounded-full text-xs font-bold">
                      {index + 1}
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="w-full bg-gray-light border-none rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder={`Option ${index + 1}`}
                    />
                    {options.length > POLL_CONFIG.MIN_OPTIONS && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <span className="material-icons">close</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {options.length < POLL_CONFIG.MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="flex items-center gap-2 text-primary font-semibold text-xs border border-primary/20 hover:border-primary/50 px-4 py-2 rounded-lg transition-all mt-4 group"
                >
                  <span className="material-icons text-sm transition-transform group-hover:scale-110">
                    add_circle_outline
                  </span>
                  Add More option
                </button>
              )}
            </div>
          </div>
        </form>

        <footer className="mt-auto border-t border-gray-light bg-white py-6 px-6">
          <div className="max-w-4xl mx-auto flex justify-end">
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
              size="lg"
            >
              Ask Question
            </Button>
          </div>
        </footer>
      </main>
    </Layout>
  );
};
