import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Camera, Shield, Bell, Palette, Award, Loader2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../services/api';
import toast from 'react-hot-toast';
import { useEffect } from 'react';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['profile'], queryFn: userApi.getProfile });
  const profile = data?.data?.data?.user;

  const { data: achieveData } = useQuery({ queryKey: ['achievements'], queryFn: userApi.getAchievements });
  const achievements = achieveData?.data?.data?.achievements || [];
  const earned = achievements.filter((a: any) => a.earned_at);

  const { register, handleSubmit, reset, formState: { isDirty } } = useForm();

  useEffect(() => {
    if (profile) {
      reset({ full_name: profile.full_name || '', bio: profile.bio || '', timezone: profile.timezone || 'UTC' });
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
    },
  });

  const TIMEZONES = [
    'UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney',
  ];

  const rarityColors: Record<string, string> = {
    common: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    rare: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    epic: 'bg-lavender-100 text-lavender-600 dark:bg-lavender-900/30 dark:text-lavender-400',
    legendary: 'bg-dawn-100 text-dawn-600 dark:bg-dawn-900/30 dark:text-dawn-400',
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 size={32} className="animate-spin text-dawn-500" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 lg:py-10">
      <h1 className="font-display text-3xl lg:text-4xl font-bold mb-8">Profile</h1>

      <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="space-y-6">

        {/* Avatar + Stats */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="card">
          <div className="flex items-start gap-5 flex-wrap">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-dawn-300 to-lavender-400 flex items-center justify-center text-white text-3xl font-bold">
                {user?.full_name?.[0] || user?.username?.[0]?.toUpperCase()}
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-dawn-500 rounded-xl flex items-center justify-center shadow-md hover:bg-dawn-600 transition-colors">
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold">{profile?.full_name || profile?.username}</h2>
              <p className="text-[var(--color-text-muted)] text-sm">@{profile?.username} · {profile?.email}</p>
              <div className="flex flex-wrap gap-3 mt-3">
                {[
                  { label: 'Mood entries', value: profile?.total_mood_entries || 0 },
                  { label: 'Journal entries', value: profile?.total_journal_entries || 0 },
                  { label: 'Streak', value: `${profile?.streak_count || 0}🔥` },
                  { label: 'Longest streak', value: `${profile?.longest_streak || 0} days` },
                ].map(s => (
                  <div key={s.label} className="text-center px-3 py-2 bg-[var(--color-surface)] rounded-xl">
                    <div className="font-bold text-lg leading-none">{s.value}</div>
                    <div className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Edit Profile Form */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="card">
          <div className="flex items-center gap-2 mb-5">
            <Shield size={18} className="text-dawn-500" />
            <h3 className="font-display font-semibold text-lg">Personal Info</h3>
          </div>
          <form onSubmit={handleSubmit((d) => updateProfile.mutate(d))} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input type="text" {...register('full_name')} className="input" placeholder="Your name" />
              </div>
              <div>
                <label className="label">Timezone</label>
                <select {...register('timezone')} className="input">
                  {TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Bio</label>
              <textarea {...register('bio')} rows={2} className="input resize-none" placeholder="Tell us a bit about yourself..." />
            </div>
            <button type="submit" disabled={!isDirty || updateProfile.isPending} className="btn-primary">
              {updateProfile.isPending ? <Loader2 size={16} className="animate-spin" /> : 'Save changes'}
            </button>
          </form>
        </motion.div>

        {/* Theme */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="card">
          <div className="flex items-center gap-2 mb-5">
            <Palette size={18} className="text-lavender-500" />
            <h3 className="font-display font-semibold text-lg">Appearance</h3>
          </div>
          <div className="flex gap-3 flex-wrap">
            {(['light', 'dark', 'system'] as const).map((theme) => (
              <button
                key={theme}
                onClick={() => {
                  updateUser({ theme_preference: theme });
                  userApi.updateProfile({ theme_preference: theme });
                  document.documentElement.classList.toggle('dark',
                    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches));
                }}
                className={`px-5 py-2.5 rounded-xl border-2 font-medium text-sm capitalize transition-all ${
                  user?.theme_preference === theme
                    ? 'border-dawn-500 bg-dawn-500/10 text-dawn-600'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '⚙️'} {theme}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }} className="card">
          <div className="flex items-center gap-2 mb-5">
            <Award size={18} className="text-sage-500" />
            <h3 className="font-display font-semibold text-lg">Achievements</h3>
            <span className="badge bg-dawn-100 text-dawn-700 dark:bg-dawn-900/30 dark:text-dawn-400 ml-auto">
              {earned.length}/{achievements.length}
            </span>
          </div>
          {achievements.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm">Complete check-ins and journal entries to earn achievements!</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {achievements.map((a: any) => (
                <div key={a.id} className={`p-3 rounded-xl border transition-all ${
                  a.earned_at
                    ? 'border-dawn-200 bg-dawn-50 dark:bg-dawn-950/30 dark:border-dawn-900/50'
                    : 'border-[var(--color-border)] opacity-40 grayscale'
                }`}>
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <div className="font-medium text-sm">{a.name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{a.description}</div>
                  <span className={`badge text-[10px] mt-2 ${rarityColors[a.rarity] || rarityColors.common}`}>
                    {a.rarity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>
    </div>
  );
}
