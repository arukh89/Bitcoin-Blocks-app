'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import { APP_CONFIG } from '@/config/app-config';
import type { Round, Guess } from '@/types';

interface GuessFormProps {
  round: Round | null;
  guesses: Guess[];
  onSubmit: (guess: number) => Promise<{ error: any }>;
}

export function GuessForm({ round, guesses, onSubmit }: GuessFormProps) {
  const { user, loading } = useFarcasterUser();
  const [guess, setGuess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userGuess = guesses.find((g) => g.fid === user?.fid);
  const canSubmit = round?.status === 'open' && !!user && !userGuess;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !guess) return;

    setError(null);
    setIsSubmitting(true);

    const guessValue = parseInt(guess);
    if (guessValue < APP_CONFIG.minGuessValue || guessValue > APP_CONFIG.maxGuessValue) {
      setError(`Guess must be between ${APP_CONFIG.minGuessValue} and ${APP_CONFIG.maxGuessValue}`);
      setIsSubmitting(false);
      return;
    }

    const result = await onSubmit(guessValue);
    if (result.error) {
      setError(typeof result.error === 'string' ? result.error : result.error.message || 'Failed to submit');
    } else {
      setGuess('');
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card p-4"
    >
      <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
        <span>🔢</span> Submit Your Guess
      </h2>

      {error && (
        <div className="p-3 mb-4 rounded-lg bg-red-500/20 border border-red-500/50 text-sm text-red-400">
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div className="p-4 rounded-lg bg-yellow-500/20 text-center">
          <p className="text-yellow-400">⏳ Loading user...</p>
        </div>
      ) : !user ? (
        <div className="p-4 rounded-lg bg-gray-500/20 text-center">
          <p className="text-gray-400">🔒 Open in Farcaster to play</p>
        </div>
      ) : !round || round.status !== 'open' ? (
        <div className="p-4 rounded-lg bg-yellow-500/20 text-center">
          <p className="text-yellow-400">⏳ Waiting for round to open</p>
        </div>
      ) : userGuess ? (
        <div className="p-4 rounded-lg bg-green-500/20 border border-green-500/30">
          <p className="text-green-400 flex items-center gap-2">
            <span>✅</span> Your prediction: <strong>{userGuess.guess.toLocaleString()} txs</strong>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 block mb-2">
              🎯 Your Prediction ({APP_CONFIG.minGuessValue} - {APP_CONFIG.maxGuessValue})
            </label>
            <input
              type="number"
              value={guess}
              onChange={(e) => setGuess(e.target.value)}
              placeholder="Enter tx count..."
              min={APP_CONFIG.minGuessValue}
              max={APP_CONFIG.maxGuessValue}
              className="w-full h-14 px-4 text-center text-xl font-bold bg-black/30 border-2 border-orange-500/50 rounded-lg focus:border-orange-500 focus:outline-none"
              disabled={isSubmitting}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={!guess || isSubmitting}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-orange-500 to-purple-500 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '⏳ Submitting...' : '🚀 Submit Prediction'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
}
