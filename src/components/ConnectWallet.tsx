'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { motion } from 'framer-motion';

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  // Find injected connector (MetaMask, Coinbase, Rabby, etc.)
  const injectedConnector = connectors.find(
    (c) => c.id === 'injected' || c.type === 'injected'
  );

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

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => injectedConnector && connect({ connector: injectedConnector })}
      disabled={isPending || !injectedConnector}
      className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 font-medium disabled:opacity-50"
    >
      {isPending ? '⏳ Connecting...' : '🔗 Connect Wallet'}
    </motion.button>
  );
}
