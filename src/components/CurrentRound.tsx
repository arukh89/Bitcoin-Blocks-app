'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Round } from '@/types';

interface CurrentRoundProps {
  round: Round | null;
  activeRounds?: Round[];
  onSelectRound?: (round: Round) => void;
}

export function CurrentRound({ round, activeRounds = [], onSelectRound }: CurrentRoundProps) {
  const [timeLeft, setTimeLeft] = useState('--:--');

  useEffect(() => {
    if (!round || round.status === 'finished') {
      setTimeLeft('--:--');
      return;
    }

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

  // No active round or round is finished - show waiting state
  if (!round || round.status === 'finished') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-6 text-center"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-4xl">⏳</span>
          <p className="text-yellow-400 font-medium">Waiting for next round...</p>
          <p className="text-xs text-gray-500">Admin will start a new round soon</p>
        </div>
      </motion.div>
    );
  }

  const statusColors = {
    open: 'bg-green-500',
    closed: 'bg-yellow-500',
    finished: 'bg-purple-500',
  };

  const statusText = {
    open: 'OPEN - Submit your guess!',
    closed: 'CLOSED - Waiting for results',
    finished: 'FINISHED',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`glass-card p-4 ${round.status === 'closed' ? 'border-yellow-500/50' : ''}`}
    >
      {/* Round Selector - show if multiple active rounds */}
      {activeRounds.length > 1 && (
        <div className="mb-4 pb-3 border-b border-white/10">
          <p className="text-xs text-gray-400 mb-2">📋 Active Rounds ({activeRounds.length})</p>
          <div className="flex flex-wrap gap-2">
            {activeRounds.map((r) => (
              <button
                key={r.id}
                onClick={() => onSelectRound?.(r)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  r.id === round.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-gray-300'
                }`}
              >
                #{r.round_number}
                <span className={`ml-2 text-xs ${
                  r.status === 'open' ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {r.status === 'open' ? '🟢' : '🟡'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{round.status === 'open' ? '🎮' : '⏰'}</span>
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
              className={`font-mono font-bold text-xl ${
                round.status === 'open' ? 'text-orange-400' : 
                round.status === 'closed' ? 'text-yellow-400' : 'text-gray-400'
              }`}
            >
              {round.status === 'closed' ? '⏳ Pending' : timeLeft}
            </motion.p>
          </div>

          {/* Prize info */}
          <div className="text-center">
            <p className="text-xs text-gray-400">🏆 Prize</p>
            <p className="font-bold text-green-400">{round.prize}</p>
          </div>
        </div>
      </div>

      {/* Status message */}
      <div className={`mt-3 text-center text-sm py-2 rounded-lg ${
        round.status === 'open' ? 'bg-green-500/10 text-green-400' :
        round.status === 'closed' ? 'bg-yellow-500/10 text-yellow-400' : ''
      }`}>
        {statusText[round.status]}
      </div>
    </motion.div>
  );
}
