import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { moodApi } from '../services/api';
import toast from 'react-hot-toast';

// ─── Mood Data ────────────────────────────────────────────────────────────────
const MOODS = [
  { score: 1, label: 'Awful',     emoji: '😞', color: '#ef4444', bg: 'from-red-100 to-red-200 dark:from-red-950/40 dark:to-red-900/40' },
  { score: 2, label: 'Bad',       emoji: '😔', color: '#f97316', bg: 'from-orange-100 to-orange-200 dark:from-orange-950/40 dark:to-orange-900/40' },
  { score: 3, label: 'Poor',      emoji: '😕', color: '#f59e0b', bg: 'from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-amber-900/40' },
  { score: 4, label: 'Low',       emoji: '😐', color: '#eab308', bg: 'from-yellow-100 to-yellow-200 dark:from-yellow-950/40 dark:to-yellow-900/40' },
  { score: 5, label: 'Okay',      emoji: '🙂', color: '#84cc16', bg: 'from-lime-100 to-lime-200 dark:from-lime-950/40 dark:to-lime-900/40' },
  { score: 6, label: 'Good',      emoji: '😊', color: '#22c55e', bg: 'from-green-100 to-green-200 dark:from-green-950/40 dark:to-green-900/40' },
  { score: 7, label: 'Great',     emoji: '😄', color: '#10b981', bg: 'from-emerald-100 to-emerald-200 dark:from-emerald-950/40 dark:to-emerald-900/40' },
  { score: 8, label: 'Excellent', emoji: '🤩', color: '#06b6d4', bg: 'from-cyan-100 to-cyan-200 dark:from-cyan-950/40 dark:to-cyan-900/40' },
  { score: 9, label: 'Amazing',   emoji: '🥳', color: '#3b82f6', bg: 'from-blue-100 to-blue-200 dark:from-blue-950/40 dark:to-blue-900/40' },
  { score: 10, label: 'Perfect',  emoji: '🌟', color: '#8b5cf6', bg: 'from-violet-100 to-violet-200 dark:from-violet-950/40 dark:to-violet-900/40' },
];

const ACTIVITIES = [
  '🏃 Exercise', '🧘 Meditation', '📚 Reading', '🎵 Music',
  '👫 Socializing', '🌿 Nature', '🍳 Cooking', '🎮 Gaming',
  '🎨 Creating', '😴 Rest', '💼 Work', '📱 Social media',
  '🏠 Home tasks', '🚗 Travel', '☕ Coffee/Tea', '🍔 Eating',
];

const TRIGGERS = [
  '💼 Work stress', '👥 Relationships', '💰 Finances', '🏥 Health',
  '😴 Poor sleep', '📰 News', '🌦 Weather', '🎯 Goals',
  '🔄 Routine', '🌙 Loneliness', '💪 Achievement', '😤 Conflict',
];

const STEPS = ['mood', 'details', 'context', 'notes'];

export default function MoodCheckInPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    mood_score: 0,
    mood_label: '',
    mood_emoji: '',
    energy_level: 3,
    anxiety_level: 2,
    sleep_hours: 7,
    activities: [] as string[],
    triggers: [] as string[],
    notes: '',
  });

  const createMood = useMutation({
    mutationFn: moodApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood'] });
      queryClient.invalidateQueries({ queryKey: ['insights'] });
      toast.success('Mood logged! Keep it up 🌟');
      navigate('/dashboard');
    },
  });

  const selectedMood = MOODS.find(m => m.score === form.mood_score);

  const toggleItem = (key: 'activities' | 'triggers', val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val],
    }));
  };

  const canProceed = () => {
    if (step === 0) return form.mood_score > 0;
    return true;
  };

  const handleSubmit = () => {
    createMood.mutate({
      ...form,
      mood_label: form.mood_label,
      mood_emoji: form.mood_emoji,
      activities: form.activities.map(a => a.split(' ').slice(1).join(' ')),
      triggers: form.triggers.map(t => t.split(' ').slice(1).join(' ')),
    });
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const [direction, setDirection] = useState(1);
  const goNext = () => { setDirection(1); setStep(s => s + 1); };
  const goPrev = () => { setDirection(-1); setStep(s => s - 1); };

  return (
    <div className="min-h-[calc(100vh-56px)] lg:min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl">

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-dawn-500' : 'bg-[var(--color-border)]'}`} />
            </div>
          ))}
          <span className="text-sm text-[var(--color-text-muted)] ml-2 shrink-0">{step + 1}/{STEPS.length}</span>
        </div>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: 'easeInOut' }}
          >

            {/* Step 0: Mood Selection */}
            {step === 0 && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="font-display text-4xl font-bold mb-2">How are you feeling?</h1>
                  <p className="text-[var(--color-text-muted)]">Pick the mood that best describes right now</p>
                </div>

                {/* Big emoji display */}
                <AnimatePresence mode="wait">
                  {selectedMood && (
                    <motion.div
                      key={selectedMood.score}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      className="flex flex-col items-center mb-6"
                    >
                      <span className="text-8xl mb-2">{selectedMood.emoji}</span>
                      <span className="font-display text-2xl font-bold" style={{ color: selectedMood.color }}>
                        {selectedMood.label}
                      </span>
                    </motion.div>
                  )}
                  {!selectedMood && (
                    <div className="flex flex-col items-center mb-6 h-[140px] justify-center">
                      <span className="text-6xl opacity-20">😶</span>
                    </div>
                  )}
                </AnimatePresence>

                {/* Mood grid */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {MOODS.map((mood) => (
                    <motion.button
                      key={mood.score}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setForm(f => ({ ...f, mood_score: mood.score, mood_label: mood.label, mood_emoji: mood.emoji }))}
                      className={`
                        flex flex-col items-center gap-1 py-3 px-1 rounded-2xl border-2 transition-all duration-200
                        ${form.mood_score === mood.score
                          ? 'border-current scale-105 shadow-lg'
                          : 'border-transparent bg-[var(--color-surface-alt)] hover:border-[var(--color-border)]'
                        }
                      `}
                      style={form.mood_score === mood.score ? { borderColor: mood.color, backgroundColor: `${mood.color}15` } : {}}
                    >
                      <span className="text-2xl">{mood.emoji}</span>
                      <span className="text-[10px] font-medium text-[var(--color-text-muted)]">{mood.score}</span>
                    </motion.button>
                  ))}
                </div>

                {/* Slider */}
                {form.mood_score > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                    <input
                      type="range" min="1" max="10" value={form.mood_score}
                      onChange={(e) => {
                        const score = parseInt(e.target.value);
                        const mood = MOODS[score - 1];
                        setForm(f => ({ ...f, mood_score: score, mood_label: mood.label, mood_emoji: mood.emoji }));
                      }}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: selectedMood?.color }}
                    />
                  </motion.div>
                )}
              </div>
            )}

            {/* Step 1: Energy & Anxiety & Sleep */}
            {step === 1 && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="font-display text-4xl font-bold mb-2">Physical state</h1>
                  <p className="text-[var(--color-text-muted)]">How's your body feeling today?</p>
                </div>

                <div className="space-y-8">
                  {[
                    { key: 'energy_level', label: 'Energy Level', min: 1, max: 5, step: 1,
                      labels: ['Exhausted', 'Tired', 'Neutral', 'Energized', 'Buzzing'],
                      color: '#f59e0b', emoji: '⚡' },
                    { key: 'anxiety_level', label: 'Anxiety Level', min: 1, max: 5, step: 1,
                      labels: ['Very calm', 'Calm', 'Neutral', 'Anxious', 'Very anxious'],
                      color: '#8b5cf6', emoji: '💫' },
                  ].map(({ key, label, min, max, labels, color, emoji }) => (
                    <div key={key}>
                      <div className="flex justify-between items-center mb-3">
                        <label className="font-medium flex items-center gap-2">{emoji} {label}</label>
                        <span className="badge" style={{ background: `${color}20`, color }}>
                          {labels[(form[key as keyof typeof form] as number) - 1]}
                        </span>
                      </div>
                      <input
                        type="range" min={min} max={max} step={1}
                        value={form[key as keyof typeof form] as number}
                        onChange={(e) => setForm(f => ({ ...f, [key]: parseInt(e.target.value) }))}
                        className="w-full h-2 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: color }}
                      />
                      <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                        <span>{labels[0]}</span><span>{labels[4]}</span>
                      </div>
                    </div>
                  ))}

                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <label className="font-medium flex items-center gap-2">😴 Sleep last night</label>
                      <span className="badge bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-400">
                        {form.sleep_hours}h
                      </span>
                    </div>
                    <input
                      type="range" min="0" max="12" step="0.5"
                      value={form.sleep_hours}
                      onChange={(e) => setForm(f => ({ ...f, sleep_hours: parseFloat(e.target.value) }))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#447f64' }}
                    />
                    <div className="flex justify-between text-xs text-[var(--color-text-muted)] mt-1">
                      <span>0h</span><span>12h</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Activities & Triggers */}
            {step === 2 && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="font-display text-4xl font-bold mb-2">What's going on?</h1>
                  <p className="text-[var(--color-text-muted)]">Select activities and anything affecting you</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3 text-[var(--color-text-muted)] text-sm uppercase tracking-wide">Activities today</h3>
                    <div className="flex flex-wrap gap-2">
                      {ACTIVITIES.map((a) => (
                        <button
                          key={a}
                          onClick={() => toggleItem('activities', a)}
                          className={`badge cursor-pointer transition-all duration-200 text-sm py-1.5 px-3 ${
                            form.activities.includes(a)
                              ? 'bg-sage-500 text-white'
                              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                          }`}
                        >{a}</button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3 text-[var(--color-text-muted)] text-sm uppercase tracking-wide">Any stressors or triggers?</h3>
                    <div className="flex flex-wrap gap-2">
                      {TRIGGERS.map((t) => (
                        <button
                          key={t}
                          onClick={() => toggleItem('triggers', t)}
                          className={`badge cursor-pointer transition-all duration-200 text-sm py-1.5 px-3 ${
                            form.triggers.includes(t)
                              ? 'bg-rose-500 text-white'
                              : 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)] hover:bg-[var(--color-border)]'
                          }`}
                        >{t}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Notes & Review */}
            {step === 3 && (
              <div>
                <div className="text-center mb-8">
                  <h1 className="font-display text-4xl font-bold mb-2">Any thoughts?</h1>
                  <p className="text-[var(--color-text-muted)]">Optional: add a note about your day</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="What's on your mind? How was your day? Anything you want to remember..."
                      rows={4}
                      className="input resize-none text-base leading-relaxed"
                      maxLength={2000}
                    />
                    <p className="text-xs text-[var(--color-text-muted)] text-right mt-1">{form.notes.length}/2000</p>
                  </div>

                  {/* Summary */}
                  <div className={`card bg-gradient-to-br ${selectedMood?.bg} border-0`}>
                    <h3 className="font-display font-semibold mb-3">Your check-in summary</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-[var(--color-text-muted)]">Mood:</span> <strong>{selectedMood?.emoji} {form.mood_label} ({form.mood_score}/10)</strong></div>
                      <div><span className="text-[var(--color-text-muted)]">Energy:</span> <strong>⚡ {form.energy_level}/5</strong></div>
                      <div><span className="text-[var(--color-text-muted)]">Anxiety:</span> <strong>💫 {form.anxiety_level}/5</strong></div>
                      <div><span className="text-[var(--color-text-muted)]">Sleep:</span> <strong>😴 {form.sleep_hours}h</strong></div>
                      {form.activities.length > 0 && (
                        <div className="col-span-2"><span className="text-[var(--color-text-muted)]">Activities:</span> <strong>{form.activities.slice(0, 3).join(', ')}{form.activities.length > 3 ? '...' : ''}</strong></div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-10">
          <button onClick={goPrev} disabled={step === 0} className="btn-secondary disabled:opacity-30 flex items-center gap-2">
            <ChevronLeft size={18} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <button onClick={goNext} disabled={!canProceed()} className="btn-primary flex items-center gap-2">
              Continue <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={createMood.isPending}
              className="btn-primary flex items-center gap-2 min-w-[140px] justify-center"
            >
              {createMood.isPending ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                  <Sparkles size={18} />
                </motion.div>
              ) : (
                <><Check size={18} /> Save check-in</>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
