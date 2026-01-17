import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { PollProvider } from './context/PollContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { RoleSelection } from './pages/RoleSelection';
import { StudentOnboarding } from './pages/StudentOnboarding';
import { StudentView } from './pages/StudentView';
import { TeacherCreatePoll } from './pages/TeacherCreatePoll';
import { TeacherLiveResults } from './pages/TeacherLiveResults';
import { TeacherPollHistory } from './pages/TeacherPollHistory';
import { ConnectionStatus } from './components/common/ConnectionStatus';
import { ToastContainer } from './components/common/Toast';

// Protected Route Component - must be inside UserProvider
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'teacher' | 'student' }) => {
  const { role } = useUser();

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <UserProvider>
      <PollProvider>
        <ToastProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <GlobalToastContainer />
            <ConnectionStatus />
            <Routes>
            <Route path="/" element={<RoleSelection />} />

            {/* Student Routes */}
            <Route
              path="/student/onboarding"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/view"
              element={
                <ProtectedRoute requiredRole="student">
                  <StudentView />
                </ProtectedRoute>
              }
            />
            {/* Redirect old routes to new unified view */}
            <Route
              path="/student/poll"
              element={<Navigate to="/student/view" replace />}
            />
            <Route
              path="/student/results"
              element={<Navigate to="/student/view" replace />}
            />

            {/* Teacher Routes */}
            <Route
              path="/teacher/create"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherCreatePoll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/live"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherLiveResults />
                </ProtectedRoute>
              }
            />
            <Route
              path="/teacher/history"
              element={
                <ProtectedRoute requiredRole="teacher">
                  <TeacherPollHistory />
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
      </PollProvider>
    </UserProvider>
  );
}

// Global toast container component
const GlobalToastContainer = () => {
  const { toasts, removeToast, addToast } = useToast();

  // Set global toast function for socket service
  useEffect(() => {
    setGlobalToast(addToast);
  }, [addToast]);

  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
};

export default App;
