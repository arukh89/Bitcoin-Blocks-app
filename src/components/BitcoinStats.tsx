'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface MempoolStats {
  // Latest block
  latestBlock: {
    height: number;
    hash: string;
    txCount: number;
    timestamp: number;
    size: number;
  } | null;
  // Mempool info
  mempool: {
    count: number;
    vsize: number;
    totalFee: number;
  } | null;
  // Fees
  fees: {
    fastest: number;
    halfHour: number;
    hour: number;
    economy: number;
  } | null;
  loading: boolean;
  error: string | null;
}

export function BitcoinStats() {
  const [stats, setStats] = useState<MempoolStats>({
    latestBlock: null,
    mempool: null,
    fees: null,
    loading: true,
    error: null,
  });

  const fetchStats = async () => {
    try {
      // Fetch latest block height
      const heightRes = await fetch('https://mempool.space/api/blocks/tip/height');
      const height = await heightRes.json();

      // Fetch latest block details
      const blocksRes = await fetch('https://mempool.space/api/blocks');
      const blocks = await blocksRes.json();
      const latestBlock = blocks[0];

      // Fetch mempool stats
      const mempoolRes = await fetch('https://mempool.space/api/mempool');
      const mempool = await mempoolRes.json();

      // Fetch fee estimates
      const feesRes = await fetch('https://mempool.space/api/v1/fees/recommended');
      const fees = await feesRes.json();

      setStats({
        latestBlock: latestBlock ? {
          height: latestBlock.height,
          hash: latestBlock.id,
          txCount: latestBlock.tx_count,
          timestamp: latestBlock.timestamp,
          size: latestBlock.size,
        } : null,
        mempool: {
          count: mempool.count,
          vsize: mempool.vsize,
          totalFee: mempool.total_fee,
        },
        fees: {
          fastest: fees.fastestFee,
          halfHour: fees.halfHourFee,
          hour: fees.hourFee,
          economy: fees.economyFee,
        },
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to fetch Bitcoin stats',
      }));
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  if (stats.loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4"
      >
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="text-3xl mb-2">⏳</div>
            <p className="text-gray-400">Loading Bitcoin data...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (stats.error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-card p-4 border-red-500/30"
      >
        <p className="text-red-400 text-center">❌ {stats.error}</p>
        <button
          onClick={fetchStats}
          className="mt-2 w-full py-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition"
        >
          Retry
        </button>
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
          <span>₿</span> Bitcoin Live Stats
        </h2>
        <button
          onClick={fetchStats}
          className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Latest Block */}
      {stats.latestBlock && (
        <div className="mb-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-400">🧱</span>
            <span className="font-bold text-orange-400">Latest Block</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400">Height</p>
              <p className="font-mono font-bold">#{formatNumber(stats.latestBlock.height)}</p>
            </div>
            <div>
              <p className="text-gray-400">Transactions</p>
              <p className="font-mono font-bold text-green-400">{formatNumber(stats.latestBlock.txCount)}</p>
            </div>
            <div>
              <p className="text-gray-400">Size</p>
              <p className="font-mono">{(stats.latestBlock.size / 1000000).toFixed(2)} MB</p>
            </div>
            <div>
              <p className="text-gray-400">Time</p>
              <p className="font-mono">{formatTime(stats.latestBlock.timestamp)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Mempool */}
      {stats.mempool && (
        <div className="mb-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-400">📊</span>
            <span className="font-bold text-purple-400">Mempool (Pending)</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-400">Pending TXs</p>
              <p className="font-mono font-bold text-yellow-400">{formatNumber(stats.mempool.count)}</p>
            </div>
            <div>
              <p className="text-gray-400">Size</p>
              <p className="font-mono">{(stats.mempool.vsize / 1000000).toFixed(2)} vMB</p>
            </div>
          </div>
        </div>
      )}

      {/* Fee Estimates */}
      {stats.fees && (
        <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-cyan-400">⛽</span>
            <span className="font-bold text-cyan-400">Fee Estimates (sat/vB)</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-sm text-center">
            <div>
              <p className="text-gray-400 text-xs">Fast</p>
              <p className="font-mono font-bold text-green-400">{stats.fees.fastest}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">30min</p>
              <p className="font-mono font-bold">{stats.fees.halfHour}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">1hr</p>
              <p className="font-mono font-bold">{stats.fees.hour}</p>
            </div>
            <div>
              <p className="text-gray-400 text-xs">Eco</p>
              <p className="font-mono font-bold text-gray-400">{stats.fees.economy}</p>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 mt-3 text-center">
        Data from mempool.space • Updates every 30s
      </p>
    </motion.div>
  );
}
