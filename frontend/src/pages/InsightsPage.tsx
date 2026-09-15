import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import { moodApi, insightsApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { TrendingUp, TrendingDown, Minus, Zap, Calendar } from 'lucide-react';
import { useState } from 'react';

const PERIODS = [7, 14, 30, 90];
const MOOD_COLORS = ['#ef4444','#f97316','#f59e0b','#eab308','#84cc16','#22c55e','#10b981','#06b6d4','#3b82f6','#8b5cf6'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-glass px-3 py-2 text-sm shadow-hard">
      <p className="font-medium mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</strong></p>
      ))}
    </div>
  );
};

export default function InsightsPage() {
  const { user } = useAuthStore();
  const [period, setPeriod] = useState(30);

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['mood', 'stats', period],
    queryFn: () => moodApi.getStats(period),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['analytics'],
    queryFn: () => insightsApi.getAnalytics(),
  });

  const { data: insightsData } = useQuery({
    queryKey: ['insights'],
    queryFn: () => insightsApi.getInsights(),
  });

  const stats = statsData?.data?.data;
  const analytics = analyticsData?.data?.data;
  const insights = insightsData?.data?.data;

  const trend = stats?.trend || [];
  const distribution = stats?.distribution || [];
  const moodByDay = analytics?.moodByDayOfWeek || [];
  const moodByHour = analytics?.moodByTimeOfDay || [];

  const avgMood = parseFloat(stats?.summary?.avg_mood) || 0;
  const trendDirection = trend.length > 1
    ? (parseFloat(trend[trend.length - 1]?.avg_mood) > parseFloat(trend[0]?.avg_mood) ? 'up' : 'down')
    : 'neutral';

  const radarData = moodByDay.map((d: any) => ({
    day: d.day_name?.trim().slice(0, 3),
    mood: parseFloat(d.avg_mood),
  }));

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-display text-3xl lg:text-4xl font-bold">Insights</h1>
          <p className="text-[var(--color-text-muted)] mt-1">Patterns in your emotional journey</p>
        </div>
        <div className="flex gap-1 bg-[var(--color-surface-alt)] p-1 rounded-xl border border-[var(--color-border)]">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                period === p ? 'bg-dawn-500 text-white shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
              }`}
            >{p}d</button>
          ))}
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        {/* Summary Cards */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            {
              label: 'Avg Mood', value: avgMood ? avgMood.toFixed(1) : '—', suffix: '/10',
              icon: trendDirection === 'up' ? TrendingUp : trendDirection === 'down' ? TrendingDown : Minus,
              color: avgMood >= 7 ? 'text-sage-600' : avgMood >= 5 ? 'text-dawn-600' : 'text-rose-500',
            },
            { label: 'Best Mood', value: stats?.summary?.max_mood || '—', suffix: '/10', icon: TrendingUp, color: 'text-sage-600' },
            { label: 'Check-ins', value: stats?.summary?.total_entries || 0, suffix: '', icon: Calendar, color: 'text-dawn-600' },
            { label: 'Streak', value: user?.streak_count || 0, suffix: ' days', icon: Zap, color: 'text-lavender-600' },
          ].map(({ label, value, suffix, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className="flex items-center justify-between mb-1">
                <p className="stat-label">{label}</p>
                <Icon size={16} className={color} />
              </div>
              <p className={`stat-value ${color}`}>{value}<span className="text-base font-normal text-[var(--color-text-muted)]">{suffix}</span></p>
            </div>
          ))}
        </motion.div>

        {/* Mood Trend Line Chart */}
        <motion.div variants={item} className="card">
          <h2 className="font-display font-semibold text-xl mb-6">Mood Over Time</h2>
          {statsLoading ? (
            <div className="skeleton h-52 w-full" />
          ) : trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg_mood" name="Mood" stroke="#f2751a" strokeWidth={2.5}
                  dot={{ fill: '#f2751a', r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-[var(--color-text-muted)]">Not enough data yet</div>
          )}
        </motion.div>

        {/* Distribution + Day of Week */}
        <motion.div variants={item} className="grid lg:grid-cols-2 gap-4">

          {/* Mood Distribution */}
          <div className="card">
            <h2 className="font-display font-semibold text-xl mb-6">Mood Distribution</h2>
            {distribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={distribution} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="mood_score" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Count" radius={[4, 4, 0, 0]}>
                    {distribution.map((d: any) => (
                      <Cell key={d.mood_score} fill={MOOD_COLORS[(d.mood_score - 1)] || '#f2751a'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)]">No data yet</div>
            )}
          </div>

          {/* Day of Week Radar */}
          <div className="card">
            <h2 className="font-display font-semibold text-xl mb-6">Mood by Day</h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="var(--color-border)" />
                  <PolarAngleAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={false} />
                  <Radar name="Avg Mood" dataKey="mood" stroke="#876bf2" fill="#876bf2" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-[var(--color-text-muted)]">No data yet</div>
            )}
          </div>
        </motion.div>

        {/* Time of Day Chart */}
        {moodByHour.length > 0 && (
          <motion.div variants={item} className="card">
            <h2 className="font-display font-semibold text-xl mb-6">Mood by Time of Day</h2>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={moodByHour} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="hour"
                  tickFormatter={(h) => `${h === 0 ? 12 : h > 12 ? h - 12 : h}${h < 12 ? 'am' : 'pm'}`}
                  tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <YAxis domain={[1, 10]} tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg_mood" name="Mood" stroke="#447f64" strokeWidth={2.5}
                  dot={{ fill: '#447f64', r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* Top Activities */}
        {stats?.topActivities?.length > 0 && (
          <motion.div variants={item} className="card">
            <h2 className="font-display font-semibold text-xl mb-4">Top Activities</h2>
            <div className="space-y-3">
              {stats.topActivities.slice(0, 6).map((act: any, i: number) => {
                const max = stats.topActivities[0].count;
                const pct = Math.round((act.count / max) * 100);
                return (
                  <div key={act.activity} className="flex items-center gap-3">
                    <div className="w-5 text-center text-xs font-mono text-[var(--color-text-muted)]">{i + 1}</div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{act.activity}</span>
                        <span className="text-[var(--color-text-muted)]">{act.count}×</span>
                      </div>
                      <div className="h-1.5 bg-[var(--color-border)] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: i * 0.08 }}
                          className="h-full rounded-full bg-gradient-to-r from-dawn-400 to-rose-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
}
