'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface WinnerAnnouncementProps {
  isOpen: boolean;
  onClose: () => void;
  roundNumber: number;
  blockNumber: number;
  txCount: number;
  winner: {
    username: string;
    guess: number;
    isJackpot: boolean;
    prize: number;
  };
  secondPlace?: {
    username: string;
    guess: number;
    prize: number;
  };
  currency: string;
}

export function WinnerAnnouncementPopup({
  isOpen,
  onClose,
  roundNumber,
  blockNumber,
  txCount,
  winner,
  secondPlace,
  currency,
}: WinnerAnnouncementProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && !showConfetti) {
      setShowConfetti(true);
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen, showConfetti]);

  useEffect(() => {
    if (!isOpen) {
      setShowConfetti(false);
    }
  }, [isOpen]);

  const winnerDiff = Math.abs(winner.guess - txCount);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{ type: 'spring', damping: 15 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[95%] max-w-lg"
          >
            <div className="glass-card p-6 border-2 border-yellow-500/50 relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-orange-500/10 to-red-500/10 animate-pulse" />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition z-10"
              >
                ✕
              </button>

              <div className="relative z-10">
                {/* Header */}
                <div className="text-center mb-6">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-6xl mb-3"
                  >
                    {winner.isJackpot ? '🎰' : '🏆'}
                  </motion.div>
                  <h2 className="text-3xl font-bold text-yellow-400">
                    {winner.isJackpot ? 'JACKPOT!' : 'WINNER!'}
                  </h2>
                  <p className="text-gray-400 mt-1">Round #{roundNumber} Results</p>
                </div>

                {/* Block Info */}
                <div className="bg-black/30 rounded-lg p-4 mb-4 text-center">
                  <p className="text-sm text-gray-400">Block #{blockNumber.toLocaleString()}</p>
                  <p className="text-3xl font-bold text-green-400">
                    {txCount.toLocaleString()} <span className="text-lg">transactions</span>
                  </p>
                </div>

                {/* Winner */}
                <div className={`rounded-lg p-4 mb-4 ${winner.isJackpot ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{winner.isJackpot ? '💰' : '🥇'}</span>
                      <div>
                        <p className="font-bold text-lg text-yellow-400">@{winner.username}</p>
                        <p className="text-sm text-gray-400">
                          Guessed: {winner.guess.toLocaleString()} txs
                          {!winner.isJackpot && ` (diff: ${winnerDiff.toLocaleString()})`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-yellow-400">
                        {winner.prize.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">{currency}</p>
                    </div>
                  </div>
                </div>

                {/* Second Place */}
                {secondPlace && (
                  <div className="bg-gray-500/10 border border-gray-500/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">🥈</span>
                        <div>
                          <p className="font-bold text-gray-300">@{secondPlace.username}</p>
                          <p className="text-sm text-gray-400">
                            Guessed: {secondPlace.guess.toLocaleString()} txs
                            (diff: {Math.abs(secondPlace.guess - txCount).toLocaleString()})
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-gray-300">
                          {secondPlace.prize.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-400">{currency}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* CTA */}
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-bold text-black hover:from-yellow-600 hover:to-orange-600 transition"
                >
                  🎉 Awesome!
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
