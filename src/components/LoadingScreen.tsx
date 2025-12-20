'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

export function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const duration = 2500;
    const interval = 50;
    const steps = duration / interval;
    const increment = 100 / steps;

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-10 text-center w-[400px] max-w-[90vw]"
      >
        {/* Logo palu di dalam kotak */}
        <motion.div
          animate={{ rotate: [0, -20, 20, -20, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 1 }}
          className="text-7xl mb-6"
        >
          🛠️
        </motion.div>

        <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent mb-6">
          Bitcoin Blocks
        </h1>

        {/* Progress Bar */}
        <div className="w-full">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <p className="text-gray-400 mt-3 text-sm">
            Loading... {Math.round(progress)}%
          </p>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Predicting Bitcoin&apos;s Next Block
        </p>
      </motion.div>
    </div>
  );
}
