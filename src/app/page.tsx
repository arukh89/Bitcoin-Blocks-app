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
  AdminPanel,
  AnimatedBackground,
  PrizesAndRulesSection,
  AllPredictions,
  RecentBlocks,
  ClaimPrize,
} from '@/components';

export default function Home() {
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const { user, loading: userLoading } = useFarcasterUser();
  const {
    isLoading: gameLoading,
    isConnected,
    error,
    activeRounds,
    selectedRound,
    selectRound,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // setUser is stable, no need in deps

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
    <>
      {/* Animated Background */}
      <AnimatedBackground />

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative min-h-screen p-3 sm:p-4 pt-6 sm:pt-8 z-10"
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

          {/* Jackpot Banner - Full Width */}
          <JackpotBanner prizeConfig={prizeConfig} />

          {/* Prizes and Rules Section */}
          <PrizesAndRulesSection
            firstPrize={prizeConfig?.first_place || 1000}
            secondPrize={prizeConfig?.second_place || 500}
            currency={prizeConfig?.currency || '$SECOND'}
          />

          {/* Current Round - with round selector if multiple */}
          <CurrentRound 
            round={selectedRound} 
            activeRounds={activeRounds}
            onSelectRound={selectRound}
          />

          {/* Main Grid: 3 columns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <GuessForm
              round={selectedRound}
              guesses={guesses}
              onSubmit={handleSubmitGuess}
            />
            <Leaderboard
              round={selectedRound}
              guesses={guesses}
            />
            <GlobalChat
              messages={chatMessages}
              onSend={handleSendChat}
            />
          </div>

          {/* Claim Prize (for winners) */}
          <ClaimPrize />

          {/* All Predictions */}
          <AllPredictions />

          {/* Recent Blocks */}
          <RecentBlocks />

          {/* Admin Panel (expandable section) */}
          <AdminPanel />

          {/* Connection Status */}
          <div className="fixed bottom-4 right-4 z-50">
            <div className={`px-3 py-1 rounded-full text-xs ${
              isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </div>
          </div>
        </div>
      </motion.main>
    </>
  );
}
