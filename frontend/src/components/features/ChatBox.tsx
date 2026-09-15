import React, { useRef, useEffect, useState } from 'react';
import { MessageCircle, AlertTriangle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  flagged_risk?: boolean;
}

interface ChatBoxProps {
  conversationId: string;
  messages: Message[];
  onSendMessage: (content: string) => Promise<void>;
  isLoading?: boolean;
  hasWarning?: boolean;
}

export const ChatBox: React.FC<ChatBoxProps> = ({
  conversationId,
  messages,
  onSendMessage,
  isLoading,
  hasWarning,
}) => {
  const [input, setInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSubmitting || isLoading) return;

    const messageContent = input;
    setInput('');
    setIsSubmitting(true);

    try {
      await onSendMessage(messageContent);
    } catch (error) {
      setInput(messageContent); // Restore input on error
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Warning Banner */}
      {hasWarning && (
        <div className="bg-red-50 border-b border-red-200 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 text-sm">Help Available</h3>
            <p className="text-red-800 text-sm mt-1">
              If you're in crisis, please reach out:<br />
              <strong>US: 988 Suicide & Crisis Lifeline</strong><br />
              <strong>Text: HOME to 741741</strong>
            </p>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-500">Start a conversation with your AI Coach</p>
            <p className="text-gray-400 text-sm mt-2">Share what's on your mind...</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.flagged_risk && (
                  <div className="mt-2 flex items-center gap-1 text-xs opacity-75">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Flagged for safety review</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg rounded-bl-none flex items-center gap-2">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm text-gray-600">Coach is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSendMessage}
        className="border-t border-gray-200 p-4 bg-gray-50"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSubmitting || isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            maxLength={5000}
          />
          <button
            type="submit"
            disabled={!input.trim() || isSubmitting || isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send'}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">{input.length}/5000</p>
      </form>
    </div>
  );
};
