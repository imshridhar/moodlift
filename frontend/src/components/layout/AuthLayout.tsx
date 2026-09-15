import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-dawn-400 via-rose-400 to-lavender-500">
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-20"
          style={{backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`}} />

        {/* Floating circles */}
        {[...Array(5)].map((_, i) => (
          <motion.div key={i}
            animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }}
            className="absolute rounded-full bg-white/10 backdrop-blur-sm"
            style={{
              width: `${80 + i * 40}px`, height: `${80 + i * 40}px`,
              left: `${10 + i * 15}%`, top: `${10 + i * 15}%`,
            }}
          />
        ))}

        <div className="relative z-10 flex flex-col justify-center px-14 py-12 text-white">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-12">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles size={20} />
              </div>
              <span className="font-display text-2xl font-bold">MoodLift</span>
            </div>

            <h1 className="font-display text-5xl font-bold leading-tight mb-6">
              Your emotional <em>well-being</em> journey starts here
            </h1>
            <p className="text-white/80 text-lg leading-relaxed max-w-md">
              Track your moods, journal your thoughts, discover patterns, and lift yourself higher every single day.
            </p>

            <div className="mt-12 grid grid-cols-3 gap-4">
              {[
                { num: '10K+', label: 'Daily check-ins' },
                { num: '94%', label: 'Feel better' },
                { num: '21 days', label: 'To build habits' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                  <div className="text-2xl font-display font-bold">{stat.num}</div>
                  <div className="text-white/70 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-[var(--color-surface)]">
        <div className="w-full max-w-[440px]">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-dawn-400 to-rose-500 flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="font-display text-xl font-bold">MoodLift</span>
          </div>

          <Outlet />
        </div>
      </div>
    </div>
  );
}
