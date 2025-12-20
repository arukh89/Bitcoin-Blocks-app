'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Round } from '@/types';

interface CurrentRoundProps {
  round: Round | null;
}

export function CurrentRound({ round }: CurrentRoundProps) {
  const [timeLeft, setTimeLeft] = useState('--:--');

  useEffect(() => {
    if (!round) return;

    const updateTimer = () => {
      const now = Date.now();
      const end = new Date(round.end_time).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('00:00');
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [round]);

  if (!round) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 text-center"
      >
        <p className="text-yellow-400">⏳ Waiting for next round...</p>
      </motion.div>
    );
  }

  const statusColors = {
    open: 'bg-green-500',
    closed: 'bg-yellow-500',
    finished: 'bg-purple-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="glass-card p-4"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🎮</span>
          <span className="font-bold text-lg">Round #{round.round_number}</span>
          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[round.status]} text-white uppercase`}>
            {round.status}
          </span>
        </div>

        <div className="flex items-center gap-6">
          {round.block_number && (
            <div className="text-center">
              <p className="text-xs text-gray-400">🧱 Target Block</p>
              <p className="font-mono font-bold">#{round.block_number.toLocaleString()}</p>
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-gray-400">⏱ Time Left</p>
            <motion.p
              animate={round.status === 'open' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
              className="font-mono font-bold text-xl text-orange-400"
            >
              {timeLeft}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
