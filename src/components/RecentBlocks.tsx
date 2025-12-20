'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface BitcoinBlock {
  height: number;
  hash: string;
  tx_count: number;
  timestamp: number;
  size: number;
}

export function RecentBlocks() {
  const [blocks, setBlocks] = useState<BitcoinBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlocks = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/mempool?action=recent-blocks');
      
      if (!response.ok) {
        throw new Error('Failed to fetch blocks');
      }
      
      const data = await response.json();
      setBlocks(data.slice(0, 10)); // Display 10 blocks
    } catch (err: any) {
      setError(err.message || 'Failed to load blocks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlocks();
    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchBlocks, 60000);
    return () => clearInterval(interval);
  }, [fetchBlocks]);

  const formatHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };

  const formatSize = (size: number) => `${(size / 1000000).toFixed(2)} MB`;

  // Loading skeleton
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4"
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <span>🧱</span> Recent Blocks
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-48 h-32 bg-white/5 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4 border-red-500/30"
      >
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4">
          <span>🧱</span> Recent Blocks
        </h2>
        <div className="text-center py-4">
          <p className="text-red-400 mb-3">❌ {error}</p>
          <button
            onClick={fetchBlocks}
            className="px-4 py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
          >
            🔄 Retry
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <span>🧱</span> Recent Blocks
        </h2>
        <button
          onClick={fetchBlocks}
          className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent" style={{ scrollbarWidth: 'thin' }}>
        {blocks.map((block, index) => (
          <motion.div
            key={block.hash}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0 w-48 p-3 rounded-lg bg-gradient-to-br from-orange-500/10 to-purple-500/10 border border-orange-500/20 hover:border-orange-500/40 transition"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">Block</span>
              <span className="font-mono font-bold text-orange-400">
                #{block.height.toLocaleString()}
              </span>
            </div>
            
            <div className="text-center my-3">
              <p className="text-xs text-gray-400">Transactions</p>
              <p className="text-2xl font-bold text-green-400">
                {block.tx_count.toLocaleString()}
              </p>
            </div>
            
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-400">Hash</span>
                <span className="font-mono text-gray-300">{formatHash(block.hash)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Size</span>
                <span className="font-mono">{formatSize(block.size)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Time</span>
                <span className="font-mono">{formatTime(block.timestamp)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <p className="text-xs text-gray-500 mt-3 text-center">
        Auto-refreshes every 60 seconds
      </p>
    </motion.div>
  );
}
