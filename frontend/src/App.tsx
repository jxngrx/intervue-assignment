import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './context/UserContext';
import { PollProvider } from './context/PollContext';
import { RoleSelection } from './pages/RoleSelection';
import { StudentOnboarding } from './pages/StudentOnboarding';
import { StudentView } from './pages/StudentView';
import { TeacherCreatePoll } from './pages/TeacherCreatePoll';
import { TeacherLiveResults } from './pages/TeacherLiveResults';
import { TeacherPollHistory } from './pages/TeacherPollHistory';
import { ConnectionStatus } from './components/common/ConnectionStatus';

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
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
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
      </PollProvider>
    </UserProvider>
  );
}

export default App;
