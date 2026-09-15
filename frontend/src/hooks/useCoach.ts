import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { coachApi } from '../services/coachApi';

export const useConversations = () => {
  return useQuery({
    queryKey: ['coach', 'conversations'],
    queryFn: () => coachApi.getConversations(),
  });
};

export const useConversation = (conversationId: string) => {
  return useQuery({
    queryKey: ['coach', 'conversation', conversationId],
    queryFn: () => coachApi.getConversation(conversationId),
    enabled: !!conversationId,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data?: { title?: string; lastMoodScore?: number; challenges?: string[] }) =>
      coachApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversations'] });
    },
  });
};

export const useSendMessage = (conversationId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => coachApi.sendMessage(conversationId, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversation', conversationId] });
    },
  });
};

export const useDeleteConversation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => coachApi.deleteConversation(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversations'] });
    },
  });
};
