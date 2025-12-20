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
  BitcoinStats,
  AdminPanel,
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

  // Initial loading (3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading || userLoading || gameLoading) {
    return <LoadingScreen />;
  }

  const handleSubmitGuess = async (guess: number) => {
    return submitGuess(guess);
  };

  const handleSendChat = async (message: string) => {
    return sendChatMessage(message, 'chat');
  };

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen p-3 sm:p-4 pt-6 sm:pt-8"
    >
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Error Banner */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50 text-center text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Header */}
        <Header />

        {/* Top Row: Jackpot + Bitcoin Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <JackpotBanner prizeConfig={prizeConfig} />
          <BitcoinStats />
        </div>

        {/* Current Round */}
        <CurrentRound round={activeRound} />

        {/* Main Grid: 3 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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

        {/* Admin Panel (expandable section) */}
        <AdminPanel />

        {/* Connection Status */}
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
