'use client';

import { motion } from 'framer-motion';
import type { PrizeConfig } from '@/types';

interface JackpotBannerProps {
  prizeConfig: PrizeConfig | null;
}

export function JackpotBanner({ prizeConfig }: JackpotBannerProps) {
  const jackpot = prizeConfig?.jackpot || 5000;
  const currency = prizeConfig?.currency || '$SECOND';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-8 border-yellow-500/30 relative overflow-hidden shimmer"
    >
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 mb-3">
          <span className="text-6xl lg:text-7xl">💰</span>
          <p className="text-yellow-400 text-3xl lg:text-4xl font-bold">Jackpot</p>
        </div>
        <motion.p
          animate={{
            textShadow: [
              '0 0 20px rgba(234,179,8,0.5)',
              '0 0 40px rgba(234,179,8,0.8)',
              '0 0 20px rgba(234,179,8,0.5)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-5xl lg:text-6xl font-bold text-yellow-400"
        >
          {jackpot.toLocaleString()} {currency}
        </motion.p>
      </div>
    </motion.div>
  );
}
