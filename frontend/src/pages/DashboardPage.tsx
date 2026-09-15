import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Smile, BookOpen, TrendingUp, Zap, ArrowRight, Quote, Sun, Moon, Sunset } from 'lucide-react';
import { format } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { moodApi, quoteApi, insightsApi } from '../services/api';
import MoodMiniChart from '../components/features/MoodMiniChart';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good morning', Icon: Sun };
  if (h < 17) return { text: 'Good afternoon', Icon: Sunset };
  return { text: 'Good evening', Icon: Moon };
};

const moodColors: Record<number, string> = {
  1: '#ef4444', 2: '#f97316', 3: '#f59e0b', 4: '#eab308',
  5: '#84cc16', 6: '#22c55e', 7: '#10b981', 8: '#06b6d4',
  9: '#3b82f6', 10: '#8b5cf6',
};

const moodEmojis: Record<string, string> = {
  Awful: '😞', Bad: '😔', Poor: '😕', Low: '😐', Okay: '🙂',
  Good: '😊', Great: '😄', Excellent: '🤩', Amazing: '🥳', Perfect: '🌟',
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { text: greeting, Icon: GreetingIcon } = getGreeting();

  const { data: todayMoodData } = useQuery({ queryKey: ['mood', 'today'], queryFn: () => moodApi.getToday() });
  const { data: statsData } = useQuery({ queryKey: ['mood', 'stats', 7], queryFn: () => moodApi.getStats(7) });
  const { data: quoteData } = useQuery({ queryKey: ['quote', 'daily'], queryFn: () => quoteApi.getDaily() });
  const { data: insightsData } = useQuery({ queryKey: ['insights'], queryFn: () => insightsApi.getInsights() });

  const todayEntry = todayMoodData?.data?.data?.entry;
  const stats = statsData?.data?.data;
  const quote = quoteData?.data?.data?.quote;
  const insights = insightsData?.data?.data;

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.35 } } };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-2 text-[var(--color-text-muted)] text-sm mb-1">
          <GreetingIcon size={14} />
          <span>{format(new Date(), 'EEEE, MMMM d')}</span>
        </div>
        <h1 className="font-display text-3xl lg:text-4xl font-bold text-[var(--color-text)]">
          {greeting}, <span className="text-gradient">{user?.full_name?.split(' ')[0] || user?.username}</span> ✨
        </h1>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4 lg:gap-6">

        {/* Today's Check-in Card */}
        <motion.div variants={item}>
          {todayEntry ? (
            <div className="card relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 -translate-y-12 translate-x-12"
                style={{ background: moodColors[todayEntry.mood_score] }} />
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[var(--color-text-muted)] text-sm mb-1">Today's mood</p>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{todayEntry.mood_emoji || moodEmojis[todayEntry.mood_label] || '🙂'}</span>
                    <div>
                      <h2 className="font-display text-2xl font-bold" style={{ color: moodColors[todayEntry.mood_score] }}>
                        {todayEntry.mood_label}
                      </h2>
                      <p className="text-[var(--color-text-muted)] text-sm">Score: {todayEntry.mood_score}/10</p>
                    </div>
                  </div>
                </div>
                <Link to="/check-in" className="btn-secondary text-sm">Update mood</Link>
              </div>
              {todayEntry.notes && (
                <p className="text-[var(--color-text-muted)] text-sm bg-[var(--color-surface)] rounded-xl px-4 py-3 italic">
                  "{todayEntry.notes}"
                </p>
              )}
              {todayEntry.activities?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {todayEntry.activities.map((a: string) => (
                    <span key={a} className="badge bg-[var(--color-surface)] text-[var(--color-text-muted)]">{a}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Link to="/check-in">
              <div className="card border-2 border-dashed border-dawn-200 hover:border-dawn-400 dark:border-dawn-800 dark:hover:border-dawn-600
                             bg-gradient-to-br from-dawn-50 to-rose-50 dark:from-dawn-950/30 dark:to-rose-950/30
                             cursor-pointer group transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-dawn-400 to-rose-500 flex items-center justify-center shadow-glow-dawn group-hover:scale-105 transition-transform">
                    <Smile size={28} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="font-display text-xl font-bold text-[var(--color-text)]">How are you feeling today?</h2>
                    <p className="text-[var(--color-text-muted)] text-sm">Take a moment to check in with yourself</p>
                  </div>
                  <ArrowRight size={20} className="text-dawn-500 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          )}
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Day Streak', value: `${user?.streak_count || 0}🔥`, desc: 'Keep going!' },
            { label: 'Avg Mood', value: stats?.summary?.avg_mood ? `${stats.summary.avg_mood}/10` : '—', desc: 'Last 7 days' },
            { label: 'Check-ins', value: stats?.summary?.total_entries || 0, desc: 'This week' },
            { label: 'Avg Energy', value: stats?.summary?.avg_energy ? `${stats.summary.avg_energy}/5` : '—', desc: 'Last 7 days' },
          ].map((stat) => (
            <div key={stat.label} className="stat-card">
              <p className="stat-label">{stat.label}</p>
              <p className="stat-value text-2xl">{stat.value}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{stat.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Mood Chart + Quick Actions */}
        <motion.div variants={item} className="grid lg:grid-cols-3 gap-4">
          {/* Chart */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg">Mood Trend</h3>
              <Link to="/insights" className="text-sm text-dawn-600 hover:text-dawn-700 flex items-center gap-1">
                View more <ArrowRight size={14} />
              </Link>
            </div>
            <MoodMiniChart data={stats?.trend || []} />
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col gap-3">
            <h3 className="font-display font-semibold text-lg px-1">Quick Actions</h3>
            {[
              { to: '/journal/new', icon: BookOpen, label: 'Write in journal', color: 'from-sage-400 to-sage-600', glow: 'glow-sage' },
              { to: '/insights', icon: TrendingUp, label: 'View insights', color: 'from-lavender-400 to-lavender-600', glow: 'glow-lavender' },
            ].map(({ to, icon: Icon, label, color, glow }) => (
              <Link key={to} to={to} className="card hover:shadow-medium cursor-pointer group transition-all duration-200 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${glow}`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="font-medium text-sm">{label}</span>
                <ArrowRight size={14} className="ml-auto text-[var(--color-text-muted)] group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Daily Quote */}
        {quote && (
          <motion.div variants={item}>
            <div className="card bg-gradient-to-br from-lavender-50 to-dawn-50 dark:from-lavender-950/30 dark:to-dawn-950/30 border-lavender-100 dark:border-lavender-900/50">
              <Quote size={20} className="text-lavender-400 mb-3" />
              <blockquote className="font-display text-xl italic text-[var(--color-text)] leading-relaxed mb-3">
                "{quote.content}"
              </blockquote>
              {quote.author && (
                <cite className="text-sm text-[var(--color-text-muted)] not-italic">— {quote.author}</cite>
              )}
            </div>
          </motion.div>
        )}

        {/* Insights / Nudges */}
        {insights?.insights?.length > 0 && (
          <motion.div variants={item} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {insights.insights.map((insight: any, i: number) => (
              <div key={i} className={`card flex gap-3 ${
                insight.type === 'positive' ? 'border-sage-200 bg-sage-50/50 dark:bg-sage-950/20' :
                insight.type === 'achievement' ? 'border-dawn-200 bg-dawn-50/50 dark:bg-dawn-950/20' :
                ''
              }`}>
                <span className="text-2xl">{insight.icon}</span>
                <div>
                  <h4 className="font-medium text-sm mb-1">{insight.title}</h4>
                  <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{insight.message}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
