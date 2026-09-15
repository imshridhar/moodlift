/**
 * Shared UI Components
 */
import { motion } from 'framer-motion';
import { AlertTriangle, Loader2, LucideIcon } from 'lucide-react';
import { useState } from 'react';

// ─── Loading Spinner ──────────────────────────────────────────────────────────
interface SpinnerProps { size?: number; className?: string; }

export const LoadingSpinner = ({ size = 24, className = '' }: SpinnerProps) => (
  <Loader2 size={size} className={`animate-spin text-dawn-500 ${className}`} />
);

export const FullPageSpinner = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <LoadingSpinner size={36} />
  </div>
);

// ─── Empty State ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState = ({ icon = '🌱', title, description, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <span className="text-5xl mb-4">{icon}</span>
    <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
    {description && <p className="text-[var(--color-text-muted)] text-sm max-w-sm mb-6">{description}</p>}
    {action && (
      <button onClick={action.onClick} className="btn-primary">{action.label}</button>
    )}
  </div>
);

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
interface SkeletonProps { className?: string; }

export const Skeleton = ({ className = '' }: SkeletonProps) => (
  <div className={`skeleton ${className}`} />
);

export const CardSkeleton = () => (
  <div className="card space-y-3">
    <Skeleton className="h-5 w-2/3" />
    <Skeleton className="h-4 w-full" />
    <Skeleton className="h-4 w-4/5" />
  </div>
);

// ─── Confirm Modal ────────────────────────────────────────────────────────────
interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}

export const ConfirmModal = ({
  isOpen, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  onConfirm, onCancel, danger = false
}: ConfirmModalProps) => {
  if (!isOpen) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="card max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          {danger && <AlertTriangle size={22} className="text-rose-500 shrink-0 mt-0.5" />}
          <div>
            <h3 className="font-display font-semibold text-lg">{title}</h3>
            <p className="text-[var(--color-text-muted)] text-sm mt-1">{message}</p>
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">{cancelLabel}</button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-primary bg-rose-500 hover:bg-rose-600' : 'btn-primary'}
          >{confirmLabel}</button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Badge ────────────────────────────────────────────────────────────────────
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const badgeVariants = {
  default: 'bg-[var(--color-surface-alt)] text-[var(--color-text-muted)]',
  success: 'bg-sage-100 text-sage-700 dark:bg-sage-900/30 dark:text-sage-400',
  warning: 'bg-dawn-100 text-dawn-700 dark:bg-dawn-900/30 dark:text-dawn-400',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  info: 'bg-lavender-100 text-lavender-700 dark:bg-lavender-900/30 dark:text-lavender-400',
};

export const Badge = ({ children, variant = 'default', className = '' }: BadgeProps) => (
  <span className={`badge ${badgeVariants[variant]} ${className}`}>{children}</span>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ReactNode;
  color?: string;
  loading?: boolean;
}

export const StatCard = ({ label, value, sub, icon, color, loading }: StatCardProps) => (
  <div className="stat-card">
    <div className="flex items-center justify-between mb-1">
      <p className="stat-label">{label}</p>
      {icon && <span style={{ color }}>{icon}</span>}
    </div>
    {loading ? <Skeleton className="h-9 w-24 mt-1" /> : (
      <p className="stat-value" style={color ? { color } : undefined}>{value}</p>
    )}
    {sub && <p className="text-xs text-[var(--color-text-muted)]">{sub}</p>}
  </div>
);

// ─── Toggle ───────────────────────────────────────────────────────────────────
interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: string; }

export const Toggle = ({ checked, onChange, label }: ToggleProps) => (
  <label className="flex items-center gap-3 cursor-pointer">
    <div
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${checked ? 'bg-dawn-500' : 'bg-[var(--color-border)]'}`}
    >
      <motion.div
        animate={{ x: checked ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
      />
    </div>
    {label && <span className="text-sm font-medium">{label}</span>}
  </label>
);
