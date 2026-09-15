import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[var(--color-surface)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="text-8xl mb-6">🌧️</div>
        <h1 className="font-display text-6xl font-bold text-gradient mb-4">404</h1>
        <h2 className="font-display text-2xl font-semibold mb-3">Page not found</h2>
        <p className="text-[var(--color-text-muted)] mb-8">
          Looks like this page wandered off. Let's get you back on track.
        </p>
        <Link to="/dashboard" className="btn-primary inline-flex">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}
