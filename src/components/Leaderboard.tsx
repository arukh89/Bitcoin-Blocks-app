'use client';

import { motion } from 'framer-motion';
import type { Round, Guess } from '@/types';

interface LeaderboardProps {
  round: Round | null;
  guesses: Guess[];
}

export function Leaderboard({ round, guesses }: LeaderboardProps) {
  // Sort by closest to actual (if finished) or by submission time
  const sortedGuesses = [...guesses].sort((a, b) => {
    if (round?.actual_tx_count) {
      const diffA = Math.abs(a.guess - round.actual_tx_count);
      const diffB = Math.abs(b.guess - round.actual_tx_count);
      if (diffA !== diffB) return diffA - diffB;
    }
    return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
  });

  const getRankBadge = (index: number) => {
    if (index === 0) return { bg: 'bg-gradient-to-r from-yellow-500 to-amber-500', emoji: '🥇' };
    if (index === 1) return { bg: 'bg-gradient-to-r from-gray-300 to-gray-400', emoji: '🥈' };
    if (index === 2) return { bg: 'bg-gradient-to-r from-amber-600 to-amber-700', emoji: '🥉' };
    return { bg: 'bg-gray-600', emoji: '' };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-card p-4"
    >
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
        <span>🏆</span> Leaderboard
        <span className="text-xs text-gray-400 ml-auto">{guesses.length} predictions</span>
      </h2>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {sortedGuesses.length === 0 ? (
          <p className="text-center text-gray-400 py-4">No predictions yet</p>
        ) : (
          sortedGuesses.map((guess, index) => {
            const { bg, emoji } = getRankBadge(index);
            const isWinner = round?.winner_fid === guess.fid;

            return (
              <motion.div
                key={guess.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isWinner ? 'bg-yellow-500/20 border border-yellow-500/50' : 'bg-white/5'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold ${bg}`}>
                  {emoji || `#${index + 1}`}
                </span>

                {guess.pfp_url && (
                  <img src={guess.pfp_url} alt="" className="w-8 h-8 rounded-full" />
                )}

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">@{guess.username}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(guess.submitted_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold">{guess.guess.toLocaleString()} txs</p>
                  {isWinner && <span className="text-xs text-yellow-400">🏆 WINNER!</span>}
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
