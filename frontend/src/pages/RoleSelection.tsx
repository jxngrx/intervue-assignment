import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { Layout } from '../components/layout/Layout';

export const RoleSelection = () => {
  const navigate = useNavigate();
  const { setRole } = useUser();
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (!selectedRole) return;

    setRole(selectedRole);
    if (selectedRole === 'student') {
      navigate('/student/onboarding');
    } else {
      navigate('/teacher/create');
    }
  };

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="max-w-4xl w-full text-center space-y-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <span className="material-icons text-sm">auto_awesome</span>
              <span>Intervue Poll</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
              Welcome to the{' '}
              <span className="text-gray-dark">Live Polling System</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              Please select the role that best describes you to begin using the live polling
              system
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => handleRoleSelect('student')}
              className={`role-card group relative p-8 text-left rounded-2xl bg-white border-2 transition-all focus:outline-none focus:ring-4 focus:ring-primary/20 ${
                selectedRole === 'student'
                  ? 'border-primary shadow-xl shadow-primary/20'
                  : 'border-gray-light hover:border-primary/50 shadow-sm'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <span className="material-icons text-primary text-3xl">school</span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  I'm a Student
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Join polls, submit answers, and view live results alongside your classmates in
                  real-time.
                </p>
                {selectedRole === 'student' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="material-icons text-white text-sm">check</span>
                    </div>
                  </div>
                )}
              </div>
            </button>

            <button
              onClick={() => handleRoleSelect('teacher')}
              className={`role-card group relative p-8 text-left rounded-2xl bg-white border-2 transition-all focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                selectedRole === 'teacher'
                  ? 'border-primary shadow-xl shadow-primary/20'
                  : 'border-gray-light hover:border-primary/50 shadow-sm'
              }`}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <span className="material-icons text-gray-400 text-3xl group-hover:text-primary transition-colors">
                    co_present
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  I'm a Teacher
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  Create instant polls, manage questions, and monitor your students' engagement
                  levels.
                </p>
                {selectedRole === 'teacher' && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <span className="material-icons text-white text-sm">check</span>
                    </div>
                  </div>
                )}
              </div>
            </button>
          </div>

          <div className="pt-4">
            <button
              onClick={handleContinue}
              disabled={!selectedRole}
              className="bg-gradient-to-r from-primary to-primary-light px-12 py-4 rounded-full text-white font-semibold text-lg shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};
