/**
 * Custom React Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { moodApi, journalApi, quoteApi, insightsApi, userApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

// ─── Mood Hooks ───────────────────────────────────────────────────────────────

export const useTodayMood = () =>
  useQuery({ queryKey: ['mood', 'today'], queryFn: () => moodApi.getToday(), staleTime: 60_000 });

export const useMoodHistory = (params?: any) =>
  useQuery({ queryKey: ['mood', 'history', params], queryFn: () => moodApi.getHistory(params) });

export const useMoodStats = (period = 30) =>
  useQuery({ queryKey: ['mood', 'stats', period], queryFn: () => moodApi.getStats(period) });

export const useCreateMood = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: moodApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mood'] });
      qc.invalidateQueries({ queryKey: ['insights'] });
    },
  });
};

// ─── Journal Hooks ────────────────────────────────────────────────────────────

export const useJournalEntries = (params?: any) =>
  useQuery({ queryKey: ['journal', params], queryFn: () => journalApi.getAll(params) });

export const useJournalEntry = (id: string) =>
  useQuery({ queryKey: ['journal', id], queryFn: () => journalApi.getEntry(id), enabled: !!id });

export const useDailyPrompt = () =>
  useQuery({ queryKey: ['journal-prompt'], queryFn: journalApi.getPrompts, staleTime: 86_400_000 });

export const useCreateJournal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: journalApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Entry saved!');
    },
  });
};

export const useUpdateJournal = (id: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => journalApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal', id] });
      qc.invalidateQueries({ queryKey: ['journal'] });
    },
  });
};

export const useDeleteJournal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: journalApi.delete,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal'] });
      toast.success('Entry deleted');
    },
  });
};

// ─── Quote Hooks ──────────────────────────────────────────────────────────────

export const useDailyQuote = () =>
  useQuery({ queryKey: ['quote', 'daily'], queryFn: quoteApi.getDaily, staleTime: 86_400_000 });

export const useLikeQuote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: quoteApi.like,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['quote'] }); toast.success('Quote liked!'); },
  });
};

// ─── Insights Hooks ───────────────────────────────────────────────────────────

export const useInsights = () =>
  useQuery({ queryKey: ['insights'], queryFn: insightsApi.getInsights, staleTime: 5 * 60_000 });

export const useAnalytics = () =>
  useQuery({ queryKey: ['analytics'], queryFn: insightsApi.getAnalytics, staleTime: 5 * 60_000 });

// ─── User Hooks ───────────────────────────────────────────────────────────────

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: userApi.getProfile });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  const { updateUser } = useAuthStore();
  return useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (res) => {
      updateUser(res.data.data.user);
      qc.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated!');
    },
  });
};

export const useAchievements = () =>
  useQuery({ queryKey: ['achievements'], queryFn: userApi.getAchievements });
