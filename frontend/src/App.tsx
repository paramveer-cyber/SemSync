import { useEffect, useState, lazy, Suspense } from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { AchievementProvider } from './context/AchievementContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastStack from './components/ToastStack';
import AchievementToastStack from './components/achievements/AchievementToastStack';
import CinematicUnlock from './components/achievements/CinematicUnlock';

const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CoursesPage = lazy(() => import('./pages/CoursesPage'));
const CoursePage = lazy(() => import('./pages/CoursePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const UserPage = lazy(() => import('./pages/UserPage'));
const TaskCenterPage = lazy(() => import('./pages/TaskCenterPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const FocusTimerPage = lazy(() => import('./pages/FocusTimerPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const ClassroomPage = lazy(() => import('./pages/ClassroomPage'));
const ProgressPage = lazy(() => import('./pages/ProgressPage'));

function DesktopOnly({ children }: { children: React.ReactNode }) {
    const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

    useEffect(() => {
        const handler = () => setIsDesktop(window.innerWidth >= 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    if (!isDesktop) {
        return (
            <div className='min-h-screen flex items-center justify-center mesh-bg text-center px-6'>
                <div>
                    <h1 className='text-2xl font-semibold mb-3'>
                        Desktop Only
                    </h1>
                    <p className='text-sm opacity-60'>
                        This app is designed for desktop use only. Please switch
                        to a larger screen.
                    </p>
                </div>
            </div>
        );
    }
    return <>{children}</>;
}

function PageLoader() {
    return (
        <div className='min-h-screen flex items-center justify-center mesh-bg'>
            <div className='fixed top-0 left-0 right-0 h-[2px] z-50'>
                <div
                    className='h-full animate-[loadbar_1.4s_ease-in-out_infinite]'
                    style={{
                        background:
                            'linear-gradient(90deg,var(--color-brand),var(--color-active-text))',
                        boxShadow: '0 0 8px var(--color-brand-glow)',
                    }}
                />
            </div>
            <div className='flex flex-col items-center gap-5'>
                <div className='relative w-12 h-12'>
                    <div
                        className='absolute inset-0 rounded-full'
                        style={{
                            border: '2px solid var(--color-glass-border)',
                        }}
                    />
                    <div
                        className='absolute inset-0 rounded-full animate-spin'
                        style={{
                            border: '2px solid transparent',
                            borderTopColor: 'var(--color-brand)',
                            animationDuration: '700ms',
                        }}
                    />
                    <div
                        className='absolute inset-[4px] rounded-full animate-spin'
                        style={{
                            border: '2px solid transparent',
                            borderTopColor: 'var(--color-brand-glow)',
                            animationDuration: '1100ms',
                            animationDirection: 'reverse',
                        }}
                    />
                </div>
                <p
                    className='text-sm font-medium'
                    style={{ color: 'var(--color-text-muted)' }}
                >
                    Loading…
                </p>
            </div>
        </div>
    );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user, loading } = useAuth();
    if (loading) return <PageLoader />;
    if (!user) return <Navigate to='/login' replace />;
    return <>{children}</>;
};

export default function App() {
    return (
        <DesktopOnly>
            <ThemeProvider>
                <Router>
                    <NotificationProvider>
                        <AchievementProvider>
                            <ToastStack />
                            <AchievementToastStack />
                            <CinematicUnlock />
                            <Suspense fallback={<PageLoader />}>
                                <Routes>
                                    <Route path='/' element={<LandingPage />} />
                                    <Route path='/login' element={<LoginPage />} />
                                    <Route
                                        path='/dashboard'
                                        element={
                                            <ProtectedRoute>
                                                <Dashboard />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/courses'
                                        element={
                                            <ProtectedRoute>
                                                <CoursesPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/courses/:id'
                                        element={
                                            <ProtectedRoute>
                                                <CoursePage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/calendar'
                                        element={
                                            <ProtectedRoute>
                                                <CalendarPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/tasks'
                                        element={
                                            <ProtectedRoute>
                                                <TaskCenterPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/focus'
                                        element={
                                            <ProtectedRoute>
                                                <FocusTimerPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/profile'
                                        element={
                                            <ProtectedRoute>
                                                <UserPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/settings'
                                        element={
                                            <ProtectedRoute>
                                                <SettingsPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path='/about' element={<AboutPage />} />
                                    <Route path='/legal' element={<LegalPage />} />
                                    <Route
                                        path='/classroom'
                                        element={
                                            <ProtectedRoute>
                                                <ClassroomPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='/progress'
                                        element={
                                            <ProtectedRoute>
                                                <ProgressPage />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route
                                        path='*'
                                        element={<Navigate to='/' replace />}
                                    />
                                </Routes>
                            </Suspense>
                        </AchievementProvider>
                    </NotificationProvider>
                </Router>
            </ThemeProvider>
        </DesktopOnly>
    );
}
