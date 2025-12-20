'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { motion } from 'framer-motion';
import { useState } from 'react';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const [showOptions, setShowOptions] = useState(false);

  // Get all available connectors
  const availableConnectors = connectors.filter(c => c.id !== 'injected' || c.name !== 'Injected');

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-2">
        <span className="px-3 py-2 rounded-full bg-green-500/20 border border-green-500/30 text-sm">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
        <button
          onClick={() => disconnect()}
          className="px-3 py-2 rounded-full bg-red-500/20 border border-red-500/30 text-sm hover:bg-red-500/30 transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  // If only one connector, connect directly
  if (availableConnectors.length === 1) {
    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => connect({ connector: availableConnectors[0] })}
        disabled={isPending}
        className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 font-medium disabled:opacity-50"
      >
        {isPending ? '⏳ Connecting...' : '🔗 Connect Wallet'}
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowOptions(!showOptions)}
        disabled={isPending}
        className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 font-medium disabled:opacity-50"
      >
        {isPending ? '⏳ Connecting...' : '🔗 Connect Wallet'}
      </motion.button>

      {showOptions && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50">
          {availableConnectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector });
                setShowOptions(false);
              }}
              className="w-full px-4 py-3 text-left text-sm hover:bg-gray-800 first:rounded-t-lg last:rounded-b-lg transition flex items-center gap-2"
            >
              {connector.name === 'Farcaster MiniApp' && '🟣 '}
              {connector.name.includes('Coinbase') && '🔵 '}
              {connector.name.includes('MetaMask') && '🦊 '}
              {connector.name === 'Injected' && '💉 '}
              {connector.name}
            </button>
          ))}
        </div>
      )}

      {error && (
        <p className="absolute top-full mt-1 text-xs text-red-400">
          {error.message}
        </p>
      )}
    </div>
  );
}
