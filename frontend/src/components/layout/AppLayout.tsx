import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Smile, BookOpen, TrendingUp, User,
  Bell, LogOut, Sun, Moon, Menu, X, Sparkles, Zap, MessageCircle, Award, Trophy
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { notifApi } from '../../services/api';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/check-in', icon: Smile, label: 'Check In' },
  { to: '/journal', icon: BookOpen, label: 'Journal' },
  { to: '/insights', icon: TrendingUp, label: 'Insights' },
  { to: '/coach', icon: MessageCircle, label: 'AI Coach' },
  { to: '/playbooks', icon: Award, label: 'Playbooks' },
  { to: '/challenges', icon: Trophy, label: 'Challenges' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function AppLayout() {
  const { user, clearAuth, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notifApi.getAll({ unread_only: true, limit: 5 }),
    refetchInterval: 60000,
  });
  const unreadCount = notifData?.data?.data?.unread || 0;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAuth();
      navigate('/login');
      toast.success('Logged out successfully');
    }
  };

  const toggleTheme = () => {
    const newDark = !isDark;
    setIsDark(newDark);
    document.documentElement.classList.toggle('dark', newDark);
    updateUser({ theme_preference: newDark ? 'dark' : 'light' });
  };

  const Sidebar = () => (
    <aside className="flex flex-col h-full w-64 bg-[var(--color-surface-alt)] border-r border-[var(--color-border)] p-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-2 py-4 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-dawn-400 to-rose-500 flex items-center justify-center shadow-glow-dawn">
          <Sparkles size={18} className="text-white" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none text-[var(--color-text)]">MoodLift</div>
          <div className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">Wellbeing</div>
        </div>
      </div>

      {/* User Info */}
      <div className="card-glass px-3 py-3 mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-dawn-300 to-lavender-400 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-medium text-sm text-[var(--color-text)] truncate">{user?.full_name || user?.username}</div>
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <Zap size={10} className="text-dawn-500" />
            {user?.streak_count || 0} day streak
          </div>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            onClick={() => setSidebarOpen(false)}
          >
            <Icon size={18} />
            <span>{label}</span>
            {to === '/check-in' && (
              <span className="ml-auto badge bg-dawn-500/10 text-dawn-600 text-[10px]">Today</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom Controls */}
      <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-col gap-1">
        <button onClick={toggleTheme} className="nav-link w-full text-left">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{isDark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <button onClick={handleLogout} className="nav-link w-full text-left text-rose-500 hover:text-rose-600 hover:bg-rose-500/10">
          <LogOut size={18} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-surface)]">
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 z-50 lg:hidden flex"
            >
              <Sidebar />
              <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-[-48px] w-10 h-10 bg-[var(--color-surface-alt)] rounded-xl flex items-center justify-center border border-[var(--color-border)]">
                <X size={18} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="btn-ghost p-2">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-dawn-400 to-rose-500 flex items-center justify-center">
              <Sparkles size={12} className="text-white" />
            </div>
            <span className="font-display font-bold">MoodLift</span>
          </div>
          <button className="btn-ghost p-2 relative">
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />
            )}
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
