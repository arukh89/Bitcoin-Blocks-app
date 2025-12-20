'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import { useGame } from '@/context/GameContext';
import { isAdminFid } from '@/config/app-config';
import {
  Header,
  LoadingScreen,
  JackpotBanner,
  CurrentRound,
  GuessForm,
  Leaderboard,
  GlobalChat,
} from '@/components';

export default function Home() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { user, loading: userLoading } = useFarcasterUser();
  const {
    isLoading: gameLoading,
    isConnected,
    error,
    activeRound,
    guesses,
    chatMessages,
    prizeConfig,
    setUser,
    submitGuess,
    sendChatMessage,
  } = useGame();

  // Sync Farcaster user to GameContext
  useEffect(() => {
    if (user) {
      setUser({
        fid: user.fid,
        username: user.username || `fid:${user.fid}`,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        isAdmin: isAdminFid(user.fid),
      });
    } else {
      setUser(null);
    }
  }, [user, setUser]);

  // Initial loading (3 seconds as per spec)
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Show loading screen
  if (isInitialLoading || userLoading || gameLoading) {
    return <LoadingScreen />;
  }

  // Handle guess submission
  const handleSubmitGuess = async (guess: number) => {
    return submitGuess(guess);
  };

  // Handle chat message
  const handleSendChat = async (message: string) => {
    return sendChatMessage(message, 'chat');
  };

  const userIsAdmin = isAdminFid(user?.fid);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-3 sm:p-4 pt-16 sm:pt-20"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Connection Status */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-lg bg-red-500/20 border border-red-500/50 text-center"
          >
            ⚠️ {error}
          </motion.div>
        )}

        <Header />

        <JackpotBanner prizeConfig={prizeConfig} />

        <CurrentRound round={activeRound} />

        {/* Main Grid: 3 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <GuessForm
            round={activeRound}
            guesses={guesses}
            onSubmit={handleSubmitGuess}
          />

          <Leaderboard
            round={activeRound}
            guesses={guesses}
          />

          <GlobalChat
            messages={chatMessages}
            onSend={handleSendChat}
          />
        </div>

        {/* Admin Panel Link */}
        {userIsAdmin && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <a
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30 transition"
            >
              👑 Admin Panel
            </a>
          </motion.div>
        )}

        {/* Connection indicator */}
        <div className="fixed bottom-4 right-4">
          <div className={`px-3 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
        </div>
      </div>
    </motion.main>
  );
}
