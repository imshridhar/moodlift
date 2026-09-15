import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

// Layout
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';

// Pages
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import MoodCheckInPage from './pages/MoodCheckInPage';
import JournalPage from './pages/JournalPage';
import JournalEntryPage from './pages/JournalEntryPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import NotFoundPage from './pages/NotFoundPage';
import CoachPage from './pages/CoachPage';
import PlaybooksPage from './pages/PlaybooksPage';
import ChallengesPage from './pages/ChallengesPage';

// Guards
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

export default function App() {
  const { user } = useAuthStore();

  // Apply theme
  useEffect(() => {
    const theme = user?.theme_preference || 'system';
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', systemDark);
    }
  }, [user?.theme_preference]);

  return (
    <Routes>
      {/* Public landing */}
      <Route path="/" element={<HomePage />} />

      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      </Route>

      {/* Protected app routes */}
      <Route element={<PrivateRoute><AppLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/check-in" element={<MoodCheckInPage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/journal/new" element={<JournalEntryPage />} />
        <Route path="/journal/:id" element={<JournalEntryPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/coach" element={<CoachPage />} />
        <Route path="/playbooks" element={<PlaybooksPage />} />
        <Route path="/challenges" element={<ChallengesPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
