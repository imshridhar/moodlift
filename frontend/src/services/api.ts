import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ─────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = data.data;
        useAuthStore.setState({ accessToken, refreshToken: newRefreshToken });

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Show error toast for non-auth errors
    const message = (error.response?.data as any)?.error?.message || 'Something went wrong';
    if (error.response?.status !== 401) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

// ─── Mood API ─────────────────────────────────────────────────────────────────
export const moodApi = {
  create: (data: any) => api.post('/moods', data),
  getHistory: (params?: any) => api.get('/moods', { params }),
  getToday: () => api.get('/moods/today'),
  getEntry: (id: string) => api.get(`/moods/${id}`),
  update: (id: string, data: any) => api.put(`/moods/${id}`, data),
  delete: (id: string) => api.delete(`/moods/${id}`),
  getStats: (period?: number) => api.get('/moods/stats/summary', { params: { period } }),
};

// ─── Journal API ──────────────────────────────────────────────────────────────
export const journalApi = {
  getAll: (params?: any) => api.get('/journal', { params }),
  create: (data: any) => api.post('/journal', data),
  getEntry: (id: string) => api.get(`/journal/${id}`),
  update: (id: string, data: any) => api.put(`/journal/${id}`, data),
  delete: (id: string) => api.delete(`/journal/${id}`),
  getPrompts: () => api.get('/journal/prompts/daily'),
};

// ─── Quote API ────────────────────────────────────────────────────────────────
export const quoteApi = {
  getDaily: () => api.get('/quotes/daily'),
  getAll: (params?: any) => api.get('/quotes', { params }),
  getSaved: () => api.get('/quotes/saved/me'),
  like: (id: string) => api.post(`/quotes/${id}/like`),
  save: (id: string) => api.post(`/quotes/${id}/save`),
};

// ─── User API ─────────────────────────────────────────────────────────────────
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.patch('/users/profile', data),
  updatePassword: (data: any) => api.patch('/users/password', data),
  getAchievements: () => api.get('/users/achievements'),
};

// ─── Insights API ─────────────────────────────────────────────────────────────
export const insightsApi = {
  getInsights: () => api.get('/insights'),
  getAnalytics: () => api.get('/analytics/overview'),
};

// ─── Notifications API ────────────────────────────────────────────────────────
export const notifApi = {
  getAll: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
};
