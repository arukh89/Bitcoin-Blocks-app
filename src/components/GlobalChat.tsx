'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import type { ChatMessage } from '@/types';

interface GlobalChatProps {
  messages: ChatMessage[];
  onSend: (message: string) => Promise<{ error: any }>;
}

export function GlobalChat({ messages, onSend }: GlobalChatProps) {
  const { user } = useFarcasterUser();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    setError(null);
    setIsSending(true);
    
    try {
      const { error: sendError } = await onSend(message.trim());
      if (sendError) {
        setError(typeof sendError === 'string' ? sendError : 'Failed to send message');
      } else {
        setMessage('');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const getMessageStyle = (type: ChatMessage['type']) => {
    switch (type) {
      case 'guess': return 'bg-orange-500/20 border-l-2 border-orange-500';
      case 'winner': return 'bg-yellow-500/20 border-l-2 border-yellow-500';
      case 'system': return 'bg-purple-500/20 border-l-2 border-purple-500';
      default: return 'bg-white/5 border-l-2 border-cyan-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.7 }}
      className="glass-card p-4 flex flex-col h-[400px]"
    >
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
        <span>💬</span> Live Chat
        <span className="text-xs text-gray-400 ml-auto">{messages.length} messages</span>
      </h2>

      {/* Error message */}
      {error && (
        <div className="mb-2 p-2 rounded bg-red-500/20 text-red-400 text-xs">
          ❌ {error}
        </div>
      )}

      {/* Messages - scrollable container */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2"
        style={{ minHeight: 0, maxHeight: '280px' }}
      >
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No messages yet. Be the first to chat!</p>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`p-2 rounded-lg ${getMessageStyle(msg.type)}`}>
              <div className="flex items-center gap-2 mb-1">
                {msg.pfp_url && (
                  <img src={msg.pfp_url} alt="" className="w-5 h-5 rounded-full" />
                )}
                <span className="font-medium text-sm">@{msg.username}</span>
                {msg.type === 'guess' && <span className="text-xs">🎯 Guess</span>}
                {msg.type === 'winner' && <span className="text-xs">👑</span>}
                <span className="text-xs text-gray-500 ml-auto">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm break-words">{msg.message}</p>
            </div>
          ))
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={user ? 'Type message...' : 'Login to chat'}
          disabled={!user || isSending}
          className="flex-1 px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!message.trim() || !user || isSending}
          className="px-4 py-2 bg-cyan-500 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-cyan-600 transition"
        >
          {isSending ? '⏳' : '📤'}
        </button>
      </form>
    </motion.div>
  );
}
