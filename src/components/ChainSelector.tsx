'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useSwitchChain } from 'wagmi';
import { base, baseSepolia, arbitrum } from 'viem/chains';

const CHAINS = [
  { id: base.id, name: 'Base', icon: '🔵', color: 'from-blue-500 to-blue-600' },
  { id: arbitrum.id, name: 'Arbitrum', icon: '🔷', color: 'from-blue-400 to-cyan-500' },
  { id: baseSepolia.id, name: 'Base Sepolia', icon: '🧪', color: 'from-purple-500 to-pink-500' },
];

export function ChainSelector() {
  const { chainId, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentChain = CHAINS.find((c) => c.id === chainId) || CHAINS[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSwitch = async (targetChainId: number) => {
    if (targetChainId === chainId) {
      setIsOpen(false);
      return;
    }
    try {
      switchChain({ chainId: targetChainId });
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to switch chain:', err);
    }
  };

  if (!isConnected) {
    return (
      <div className="px-3 py-2 rounded-lg bg-gray-500/20 text-gray-400 text-sm">
        🔗 No Wallet
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r ${currentChain.color} text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50`}
      >
        <span>{currentChain.icon}</span>
        <span className="hidden sm:inline">{currentChain.name}</span>
        <span className="text-xs">{isPending ? '⏳' : '▼'}</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-2 border-b border-white/10">
              <p className="text-xs text-gray-400 px-2">Select Network</p>
            </div>
            <div className="py-1">
              {CHAINS.map((chain) => (
                <button
                  key={chain.id}
                  onClick={() => handleSwitch(chain.id)}
                  className={`w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition flex items-center gap-3 ${
                    chain.id === chainId ? 'bg-white/5' : ''
                  }`}
                >
                  <span className="text-lg">{chain.icon}</span>
                  <span className="flex-1">{chain.name}</span>
                  {chain.id === chainId && (
                    <span className="text-green-400 text-xs">✓</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
