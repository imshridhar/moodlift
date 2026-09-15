import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { playbookApi } from '../services/playbookApi';

export const usePlaybooks = (
  filters?: { category?: string; difficulty?: string; limit?: number; skip?: number },
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['playbooks', filters],
    queryFn: () => playbookApi.getPlaybooks(filters),
    enabled: options?.enabled ?? true,
  });
};

export const usePlaybook = (playbookId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['playbook', playbookId],
    queryFn: () => playbookApi.getPlaybook(playbookId),
    enabled: (options?.enabled ?? true) && !!playbookId,
  });
};

export const useUserPlaybooks = (
  status?: 'active' | 'completed' | 'abandoned',
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['myPlaybooks', status],
    queryFn: () => playbookApi.getUserPlaybooks(status),
    enabled: options?.enabled ?? true,
  });
};

export const useUserPlaybookProgress = (playbookId: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['playbookProgress', playbookId],
    queryFn: () => playbookApi.getUserProgress(playbookId),
    enabled: (options?.enabled ?? true) && !!playbookId,
  });
};

export const useEnrollPlaybook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playbookId: string) => playbookApi.enrollPlaybook(playbookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPlaybooks'] });
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });
};

export const useCompleteLesson = (playbookId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (day: number) => playbookApi.completeLesson(playbookId, day),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playbookProgress', playbookId] });
      queryClient.invalidateQueries({ queryKey: ['myPlaybooks'] });
      queryClient.invalidateQueries({ queryKey: ['playbook', playbookId] });
    },
  });
};

export const useAbandonPlaybook = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playbookId: string) => playbookApi.abandonPlaybook(playbookId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPlaybooks'] });
      queryClient.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });
};
