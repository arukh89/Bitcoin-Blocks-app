'use client';

import { motion } from 'framer-motion';
import { useGame } from '@/context/GameContext';

export function AllPredictions() {
  const { guesses, selectedRound } = useGame();

  // Sort guesses by submission time (newest first for display)
  const sortedGuesses = [...guesses].sort((a, b) => {
    // If round is finished, sort by closest to actual
    if (selectedRound?.actual_tx_count) {
      const diffA = Math.abs(a.guess - selectedRound.actual_tx_count);
      const diffB = Math.abs(b.guess - selectedRound.actual_tx_count);
      if (diffA !== diffB) return diffA - diffB;
    }
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getDifference = (guess: number) => {
    if (!selectedRound?.actual_tx_count) return null;
    const diff = guess - selectedRound.actual_tx_count;
    return diff;
  };

  if (!selectedRound) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>📊</span> All Predictions
        </h2>
        <span className="text-xs text-gray-400 px-2 py-1 bg-white/10 rounded-full">
          {guesses.length} total
        </span>
      </div>

      {guesses.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="text-4xl mb-2">🎯</p>
          <p>No predictions yet. Be the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {sortedGuesses.map((guess, index) => {
            const isWinner = selectedRound?.winner_fid === guess.fid;
            const isSecond = selectedRound?.second_place_fid === guess.fid;
            const difference = getDifference(guess.guess);

            return (
              <motion.div
                key={guess.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.03 }}
                className={`p-3 rounded-lg ${
                  isWinner
                    ? 'bg-yellow-500/20 border-2 border-yellow-500/50'
                    : isSecond
                    ? 'bg-gray-400/20 border border-gray-400/50'
                    : 'bg-white/5 border border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {/* Profile Picture */}
                  {guess.pfp_url ? (
                    <img
                      src={guess.pfp_url}
                      alt=""
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-purple-500 flex items-center justify-center text-xs font-bold">
                      {guess.username.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Username */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-sm">
                      @{guess.username}
                      {isWinner && <span className="ml-1">🏆</span>}
                      {isSecond && <span className="ml-1">🥈</span>}
                    </p>
                    <p className="text-xs text-gray-400">{formatTime(guess.submitted_at)}</p>
                  </div>
                </div>

                {/* Guess Value */}
                <div className="text-center">
                  <p className="text-xl font-bold font-mono">
                    {guess.guess.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">transactions</p>
                </div>

                {/* Difference (if round finished) */}
                {difference !== null && (
                  <div className="mt-2 text-center">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        difference === 0
                          ? 'bg-green-500/20 text-green-400'
                          : Math.abs(difference) < 100
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {difference === 0
                        ? '🎯 EXACT!'
                        : difference > 0
                        ? `+${difference.toLocaleString()}`
                        : difference.toLocaleString()}
                    </span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
