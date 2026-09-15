import { api } from './api';

export const coachApi = {
  // Create a new conversation
  createConversation: async (data?: { title?: string; lastMoodScore?: number; challenges?: string[] }) => {
    const response = await api.post('/coach/conversations', data || {});
    return response.data.data;
  },

  // Get user's conversations
  getConversations: async (limit = 20, skip = 0) => {
    const response = await api.get('/coach/conversations', {
      params: { limit, skip },
    });
    return response.data.data;
  },

  // Get specific conversation with messages
  getConversation: async (conversationId: string) => {
    const response = await api.get(`/coach/conversations/${conversationId}`);
    return response.data.data;
  },

  // Send message in conversation
  sendMessage: async (conversationId: string, content: string) => {
    const response = await api.post(
      `/coach/conversations/${conversationId}/messages`,
      { content }
    );
    return {
      userMessage: response.data.data.userMessage,
      assistantResponse: response.data.data.assistantResponse,
      warning: response.data.warning || null,
    };
  },

  // Delete conversation
  deleteConversation: async (conversationId: string) => {
    const response = await api.delete(`/coach/conversations/${conversationId}`);
    return response.data;
  },
};
