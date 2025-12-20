'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PrizesAndRulesSectionProps {
  firstPrize: number;
  secondPrize: number;
  currency: string;
}

export function PrizesAndRulesSection({ firstPrize, secondPrize, currency }: PrizesAndRulesSectionProps) {
  const [isRulesExpanded, setIsRulesExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      {/* Prize Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* 1st Place */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border border-yellow-500/30 text-center">
          <div className="text-3xl mb-2">🥇</div>
          <p className="text-xs text-gray-400 mb-1">1st Place</p>
          <p className="text-2xl font-bold text-yellow-400">
            {firstPrize.toLocaleString()} {currency}
          </p>
        </div>

        {/* 2nd Place */}
        <div className="p-4 rounded-lg bg-gradient-to-br from-gray-400/20 to-gray-500/10 border border-gray-400/30 text-center">
          <div className="text-3xl mb-2">🥈</div>
          <p className="text-xs text-gray-400 mb-1">2nd Place</p>
          <p className="text-2xl font-bold text-gray-300">
            {secondPrize.toLocaleString()} {currency}
          </p>
        </div>
      </div>

      {/* Rules Section (Collapsible) */}
      <button
        onClick={() => setIsRulesExpanded(!isRulesExpanded)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition"
      >
        <span className="flex items-center gap-2 font-medium">
          <span>📜</span> Game Rules
        </span>
        <motion.span
          animate={{ rotate: isRulesExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </button>

      <AnimatePresence>
        {isRulesExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 mt-2 rounded-lg bg-white/5 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">🎯</span>
                <div>
                  <p className="font-medium text-white">How to Win</p>
                  <p className="text-gray-400">
                    Predict the exact number of transactions in the target Bitcoin block. 
                    The closest guess wins!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg">🏆</span>
                <div>
                  <p className="font-medium text-white">Winner Determination</p>
                  <p className="text-gray-400">
                    The winner is the player whose guess is closest to the actual transaction count. 
                    In case of a tie, the earliest submission wins.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg">🎰</span>
                <div>
                  <p className="font-medium text-white">Jackpot</p>
                  <p className="text-gray-400">
                    If you guess the EXACT transaction count, you win the jackpot prize!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="text-lg">⏰</span>
                <div>
                  <p className="font-medium text-white">Timing</p>
                  <p className="text-gray-400">
                    Submit your prediction before the round closes. 
                    One guess per round per player.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
