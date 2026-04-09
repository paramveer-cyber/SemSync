import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastStack from './components/ToastStack';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import CoursesPage from './pages/CoursesPage';
import CoursePage from './pages/CoursePage';
import CalendarPage from './pages/CalendarPage';
import UserPage from './pages/UserPage';
import TaskCenterPage from './pages/TaskCenterPage';
import SettingsPage from './pages/SettingsPage';
import FocusTimerPage from './pages/FocusTimerPage';
import AboutPage from './pages/AboutPage';
import LegalPage from './pages/LegalPage';

const DesktopOnly = ({ children }: { children: React.ReactNode }) => {
  const isDesktop = window.innerWidth >= 1024; // tweak if needed

  if (!isDesktop) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg text-center px-6">
        <div>
          <h1 className="text-2xl font-semibold mb-3">Desktop Only</h1>
          <p className="text-sm opacity-60">
            This app is designed for desktop use only.
            Please switch to a larger screen.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center mesh-bg">
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50">
        <div className="h-full animate-[loadbar_1.4s_ease-in-out_infinite]"
          style={{ background: 'linear-gradient(90deg,var(--color-brand),var(--color-active-text))', boxShadow: '0 0 8px var(--color-brand-glow)' }} />
      </div>
      <div className="flex flex-col items-center gap-5">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full" style={{ border: '2px solid var(--color-glass-border)' }} />
          <div className="absolute inset-0 rounded-full animate-spin"
            style={{ border: '2px solid transparent', borderTopColor: 'var(--color-brand)', animationDuration: '700ms' }} />
          <div className="absolute inset-[4px] rounded-full animate-spin"
            style={{ border: '2px solid transparent', borderTopColor: 'var(--color-brand-glow)', animationDuration: '1100ms', animationDirection: 'reverse' }} />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>Authenticating…</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default function App() {
  return (
    <DesktopOnly>
      <ThemeProvider>
      <Router>
        <NotificationProvider>
          <ToastStack />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/courses" element={<ProtectedRoute><CoursesPage /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CoursePage /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
            <Route path="/tasks" element={<ProtectedRoute><TaskCenterPage /></ProtectedRoute>} />
            <Route path="/focus" element={<ProtectedRoute><FocusTimerPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/legal" element={<LegalPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </Router>
      </ThemeProvider>
    </DesktopOnly>
  );
}
