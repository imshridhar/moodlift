import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle, MessageCircle, Plus, ChevronDown } from 'lucide-react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';

const coachApi = {
  getConversations: async () => {
    const res = await api.get('/coach/conversations');
    return res.data;
  },

  createConversation: async (title?: string) => {
    const res = await api.post('/coach/conversations', { title });
    return res.data;
  },

  getConversation: async (conversationId: string) => {
    const res = await api.get(`/coach/conversations/${conversationId}`);
    return res.data;
  },

  sendMessage: async (conversationId: string, content: string) => {
    const res = await api.post(`/coach/conversations/${conversationId}/messages`, { content });
    return res.data;
  },
};

interface Conversation {
  id: string;
  title: string;
  message_count: number;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  flagged_risk?: boolean;
}

export default function CoachPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversationsData, isLoading: loadingConversations } = useQuery({
    queryKey: ['coach', 'conversations'],
    queryFn: coachApi.getConversations,
  });

  const conversations: Conversation[] = conversationsData?.data || [];

  // Fetch selected conversation
  const { data: conversationData, isLoading: loadingMessages } = useQuery({
    queryKey: ['coach', 'conversation', selectedConversationId],
    queryFn: () => (selectedConversationId ? coachApi.getConversation(selectedConversationId) : null),
    enabled: !!selectedConversationId,
  });

  useEffect(() => {
    if (conversationData?.data?.messages) {
      setMessages(conversationData.data.messages);
    }
  }, [conversationData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Create conversation
  const createConvMutation = useMutation({
    mutationFn: coachApi.createConversation,
    onSuccess: (data) => {
      const newConv = data.data;
      setSelectedConversationId(newConv.id);
      queryClient.invalidateQueries({ queryKey: ['coach', 'conversations'] });
      setMessages([]);
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversationId || !messageInput.trim()) return;
      return coachApi.sendMessage(selectedConversationId, messageInput.trim());
    },
    onSuccess: (data) => {
      if (data?.data) {
        setMessages((prev) => [
          ...prev,
          data.data.userMessage,
          data.data.assistantResponse,
        ]);
        setMessageInput('');
        queryClient.invalidateQueries({ queryKey: ['coach', 'conversations'] });
      }
    },
  });

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
  const item = { hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0 } };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 lg:py-10 h-screen flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Your AI Coach</h1>
        <p className="text-[var(--color-text-muted)]">Get personalized emotional support and guidance</p>
      </motion.div>

      <div className="flex gap-4 flex-1 overflow-hidden">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 bg-[var(--color-background-secondary)] rounded-lg p-4 flex flex-col overflow-hidden"
        >
          <button
            onClick={() => createConvMutation.mutate(undefined)}
            disabled={createConvMutation.isPending}
            className="flex items-center justify-center gap-2 w-full mb-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition disabled:opacity-50"
          >
            <Plus size={18} />
            New Chat
          </button>

          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
            ) : conversations?.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No conversations yet</p>
            ) : (
              <motion.div variants={container} initial="hidden" animate="show" className="space-y-2">
                {conversations.map((conv) => (
                  <motion.button
                    key={conv.id}
                    variants={item}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition text-sm ${
                      selectedConversationId === conv.id
                        ? 'bg-blue-500 text-white'
                        : 'hover:bg-[var(--color-background-tertiary)]'
                    }`}
                  >
                    <p className="font-medium truncate">{conv.title || `Chat ${conv.message_count}`}</p>
                    <p className="text-xs opacity-70">{conv.message_count} messages</p>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Chat Area */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-[var(--color-background-secondary)] rounded-lg p-4 flex flex-col overflow-hidden"
        >
          {selectedConversationId ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-[var(--color-text-muted)]">Loading conversation...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-center">
                    <div>
                      <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                      <p className="text-[var(--color-text-muted)]">Start typing to begin your conversation</p>
                    </div>
                  </div>
                ) : (
                  <motion.div variants={container} initial="hidden" animate="show">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        variants={item}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-500 text-white'
                              : 'bg-[var(--color-background-tertiary)] text-[var(--color-text)]'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          {msg.flagged_risk && (
                            <div className="mt-2 pt-2 border-t border-opacity-20 border-current flex items-center gap-1 text-xs">
                              <AlertCircle size={14} />
                              Risk detected
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                  </motion.div>
                )}
              </div>

              {/* Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendMessageMutation.mutate();
                    }
                  }}
                  placeholder="Share your thoughts..."
                  className="flex-1 px-4 py-2 rounded-lg bg-[var(--color-background)] border border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendMessageMutation.isPending}
                />
                <button
                  onClick={() => sendMessageMutation.mutate()}
                  disabled={sendMessageMutation.isPending || !messageInput.trim()}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition"
                >
                  <Send size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageCircle size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-[var(--color-text-muted)] mb-4">Select a conversation or start a new one</p>
                <button
                  onClick={() => createConvMutation.mutate(undefined)}
                  disabled={createConvMutation.isPending}
                  className="px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition"
                >
                  Start New Chat
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
