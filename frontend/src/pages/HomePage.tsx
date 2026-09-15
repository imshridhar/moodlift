import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, BookOpen, Shield, Zap, ArrowRight, Star } from 'lucide-react';

const features = [
  { icon: Sparkles, title: 'Daily Mood Check-In', desc: 'Track your emotional state with rich contextual data — energy, sleep, activities, and more.', color: 'from-dawn-400 to-rose-400' },
  { icon: BookOpen, title: 'Reflective Journaling', desc: 'Write freely with daily prompts, tags, and sentiment tracking to deepen self-awareness.', color: 'from-sage-400 to-sage-600' },
  { icon: TrendingUp, title: 'Mood Analytics', desc: 'Visualise patterns across days, weeks, and months. Discover what truly lifts your spirit.', color: 'from-lavender-400 to-lavender-600' },
  { icon: Zap, title: 'Streak & Gamification', desc: 'Build consistency with daily streaks, milestones, and achievements that keep you motivated.', color: 'from-rose-400 to-dawn-400' },
  { icon: Shield, title: 'Private & Secure', desc: 'Your data is yours. End-to-end encrypted, never shared, always in your control.', color: 'from-cyan-400 to-blue-400' },
  { icon: Star, title: 'Daily Inspiration', desc: 'Curated motivational quotes matched to your mood to gently nudge you upward.', color: 'from-amber-400 to-orange-400' },
];

const testimonials = [
  { name: 'Sarah K.', role: 'UX Designer', text: 'MoodLift helped me see that my anxiety spikes every Monday. Awareness was the first step to changing it.', avatar: '👩‍💻' },
  { name: 'Marcus T.', role: 'Software Engineer', text: "I've been on a 47-day streak. The insights dashboard showed me that exercise actually does improve my mood.", avatar: '👨‍💻' },
  { name: 'Priya M.', role: 'Product Manager', text: 'The journaling prompts are thoughtful and push me just enough out of my comfort zone.', avatar: '👩‍🦱' },
];

export default function HomePage() {
  const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

  return (
    <div className="min-h-screen bg-[var(--color-surface)] overflow-x-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12 h-16
                      bg-[var(--color-surface)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-dawn-400 to-rose-500 flex items-center justify-center">
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="font-display font-bold text-lg">MoodLift</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="btn-ghost hidden sm:flex">Sign in</Link>
          <Link to="/register" className="btn-primary py-2 px-4 text-sm">Get started free</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[100vh] flex items-center justify-center pt-16 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-dawn-400/10 blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full bg-lavender-400/10 blur-[100px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-rose-400/5 blur-[120px]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 badge bg-dawn-100 text-dawn-700 dark:bg-dawn-900/40 dark:text-dawn-400 mb-6 py-1.5 px-4 text-sm">
              <Sparkles size={13} /> Emotional wellness, reimagined
            </div>

            <h1 className="font-display text-6xl lg:text-8xl font-bold leading-tight mb-6 text-balance">
              Lift your <span className="text-gradient">mood</span>,<br />
              <em>every day</em>
            </h1>

            <p className="text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto mb-10 leading-relaxed">
              MoodLift is your daily emotional well-being companion. Track how you feel, journal your thoughts,
              discover patterns, and build the resilience to thrive.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="btn-primary text-base py-4 px-8 shadow-glow-dawn">
                Start for free <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn-secondary text-base py-4 px-8">
                Sign in
              </Link>
            </div>

            <p className="text-sm text-[var(--color-text-muted)] mt-5">No credit card required · Free forever plan</p>
          </motion.div>
        </div>

        {/* Floating mood emojis */}
        {['😊', '🌟', '💪', '🧘', '❤️', '✨'].map((emoji, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
            style={{
              position: 'absolute',
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 20}%`,
              fontSize: `${24 + (i % 3) * 8}px`,
            }}
            className="animate-float hidden lg:block"
          >{emoji}</motion.div>
        ))}
      </section>

      {/* Features */}
      <section className="py-24 px-6 lg:px-12 max-w-6xl mx-auto">
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
          <motion.div variants={item} className="text-center mb-16">
            <h2 className="font-display text-5xl font-bold mb-4">Everything you need to <em>flourish</em></h2>
            <p className="text-xl text-[var(--color-text-muted)] max-w-2xl mx-auto">
              Simple, beautiful tools grounded in evidence-based well-being practices.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <motion.div key={title} variants={item} className="card hover:shadow-medium transition-all duration-300 group">
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-md group-hover:scale-105 transition-transform`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
                <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-6 bg-[var(--color-surface-alt)] border-y border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <h2 className="font-display text-4xl font-bold mb-3">Real stories of growth</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
              >
                <p className="text-[var(--color-text)] leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{t.avatar}</span>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-dawn-50 to-lavender-50 dark:from-dawn-950/20 dark:to-lavender-950/20" />
        <div className="relative z-10 max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="font-display text-5xl font-bold mb-4">Begin your journey today</h2>
            <p className="text-xl text-[var(--color-text-muted)] mb-10">
              Join thousands of people building emotional resilience, one day at a time.
            </p>
            <Link to="/register" className="btn-primary text-base py-4 px-10 shadow-glow-dawn">
              Get started — it's free <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] px-6 lg:px-12 py-8">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-dawn-400 to-rose-500 flex items-center justify-center">
              <Sparkles size={11} className="text-white" />
            </div>
            <span className="font-display font-bold">MoodLift</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">© {new Date().getFullYear()} MoodLift. All rights reserved.</p>
          <div className="flex gap-5 text-sm text-[var(--color-text-muted)]">
            <Link to="/privacy" className="hover:text-[var(--color-text)]">Privacy</Link>
            <Link to="/terms" className="hover:text-[var(--color-text)]">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
