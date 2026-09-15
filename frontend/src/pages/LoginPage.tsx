import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// ─── Login ─────────────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.full_name?.split(' ')[0] || user.username}!`);
      navigate('/dashboard');
    } catch (err: any) {
      // Error toast handled by axios interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="font-display text-3xl font-bold mb-1">Welcome back</h2>
      <p className="text-[var(--color-text-muted)] mb-8">Sign in to continue your journey</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Email</label>
          <input type="email" {...register('email')} placeholder="you@example.com" className="input" />
          {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message as string}</p>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="label mb-0">Password</label>
            <Link to="/forgot-password" className="text-xs text-dawn-600 hover:text-dawn-700">Forgot?</Link>
          </div>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} {...register('password')} placeholder="••••••••" className="input pr-11" />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message as string}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-dawn-600 hover:text-dawn-700 font-medium">Create one</Link>
      </p>
    </motion.div>
  );
}

// ─── Register ──────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  full_name: z.string().optional(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  email: z.string().email('Invalid email'),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[A-Z]/, 'At least one uppercase letter')
    .regex(/[0-9]/, 'At least one number'),
  agree: z.boolean().refine(v => v, 'You must accept the terms'),
});

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const { agree, ...payload } = data;
      const res = await authApi.register(payload);
      const { user, accessToken, refreshToken } = res.data.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Welcome to MoodLift! 🌟');
      navigate('/dashboard');
    } catch (err: any) {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <h2 className="font-display text-3xl font-bold mb-1">Start your journey</h2>
      <p className="text-[var(--color-text-muted)] mb-8">Create your MoodLift account — it's free</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">Full name <span className="text-[var(--color-border)]">(optional)</span></label>
          <input type="text" {...register('full_name')} placeholder="Alex Johnson" className="input" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Username</label>
            <input type="text" {...register('username')} placeholder="alexj" className="input" />
            {errors.username && <p className="text-xs text-rose-500 mt-1">{errors.username.message as string}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" {...register('email')} placeholder="you@example.com" className="input" />
            {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message as string}</p>}
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input type={showPass ? 'text' : 'password'} {...register('password')} placeholder="Min 8 chars, uppercase & number" className="input pr-11" />
            <button type="button" onClick={() => setShowPass(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message as string}</p>}
        </div>

        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" {...register('agree')} className="mt-0.5 accent-dawn-500" />
          <span className="text-sm text-[var(--color-text-muted)]">
            I agree to the <Link to="/terms" className="text-dawn-600 hover:underline">Terms of Service</Link> and{' '}
            <Link to="/privacy" className="text-dawn-600 hover:underline">Privacy Policy</Link>
          </span>
        </label>
        {errors.agree && <p className="text-xs text-rose-500">{errors.agree.message as string}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full justify-center mt-2">
          {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-dawn-600 hover:text-dawn-700 font-medium">Sign in</Link>
      </p>
    </motion.div>
  );
}

export default LoginPage;
