import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { challengeApi } from '../services/challengeApi';
import type { ChallengeDifficulty } from '../types/wellbeing';

export const useChallenges = (filters?: {
  category?: string;
  difficulty?: string;
  limit?: number;
  skip?: number;
}, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['challenges', filters],
    queryFn: () => challengeApi.getChallenges(filters),
    enabled: options?.enabled ?? true,
  });
};

export const useChallenge = (challengeId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['challenge', challengeId],
    queryFn: () => challengeApi.getChallenge(challengeId),
    enabled: (options?.enabled ?? true) && !!challengeId,
  });
};

export const useUserChallenges = (
  status?: 'active' | 'completed' | 'abandoned',
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['myChallenges', status],
    queryFn: () => challengeApi.getUserChallenges(status),
    enabled: options?.enabled ?? true,
  });
};

export const useUserChallengeProgress = (challengeId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['challengeProgress', challengeId],
    queryFn: () => challengeApi.getUserProgress(challengeId),
    enabled: (options?.enabled ?? true) && !!challengeId,
  });
};

export const useLeaderboard = (challengeId: string, limit?: number, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['leaderboard', challengeId, limit],
    queryFn: () => challengeApi.getLeaderboard(challengeId, limit),
    enabled: (options?.enabled ?? true) && !!challengeId,
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: string) => challengeApi.joinChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useCreateChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      category: string;
      durationDays: number;
      goal: number;
      difficulty?: ChallengeDifficulty;
      isRecurring?: boolean;
      reward?: string;
    }) => challengeApi.createChallenge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};

export const useUpdateChallengeProgress = (challengeId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (progressDelta: number) => challengeApi.updateProgress(challengeId, progressDelta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challengeProgress', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard', challengeId] });
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenge', challengeId] });
    },
  });
};

export const useAbandonChallenge = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (challengeId: string) => challengeApi.abandonChallenge(challengeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myChallenges'] });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
    },
  });
};
