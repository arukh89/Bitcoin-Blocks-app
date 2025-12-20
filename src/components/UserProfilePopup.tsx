'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { useGame } from '@/context/GameContext';
import type { FarcasterUser } from '@/hooks/useFarcasterUser';

interface UserProfilePopupProps {
  user: FarcasterUser;
  isOpen: boolean;
  onClose: () => void;
}

export function UserProfilePopup({ user, isOpen, onClose }: UserProfilePopupProps) {
  const { address } = useAccount();
  const { allRounds } = useGame();

  // Calculate total prizes won
  const prizeStats = useMemo(() => {
    if (!user?.fid) return { totalWins: 0, firstPlace: 0, secondPlace: 0, totalPrize: 0, currency: '$SECOND' };

    let firstPlace = 0;
    let secondPlace = 0;
    let totalPrize = 0;
    let currency = '$SECOND';

    allRounds.forEach((round) => {
      if (round.status !== 'finished') return;
      
      if (round.winner_fid === user.fid) {
        firstPlace++;
        totalPrize += round.first_place_prize || 0;
        if (round.prize_currency) currency = round.prize_currency;
      }
      if (round.second_place_fid === user.fid) {
        secondPlace++;
        totalPrize += round.second_place_prize || 0;
        if (round.prize_currency) currency = round.prize_currency;
      }
    });

    return { totalWins: firstPlace + secondPlace, firstPlace, secondPlace, totalPrize, currency };
  }, [allRounds, user?.fid]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-md"
          >
            <div className="glass-card p-6 border-purple-500/30">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
              >
                ✕
              </button>

              {/* Profile Header */}
              <div className="flex flex-col items-center mb-6">
                {user.pfpUrl ? (
                  <img
                    src={user.pfpUrl}
                    alt={user.username || 'Profile'}
                    className="w-24 h-24 rounded-full border-4 border-purple-500/50 mb-4"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-orange-500 flex items-center justify-center text-4xl mb-4">
                    👤
                  </div>
                )}
                <h2 className="text-2xl font-bold">
                  {user.displayName || user.username || `User #${user.fid}`}
                </h2>
                {user.username && (
                  <p className="text-purple-400">@{user.username}</p>
                )}
              </div>

              {/* Profile Details */}
              <div className="space-y-4">
                {/* Prize Stats */}
                {prizeStats.totalWins > 0 && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30">
                    <p className="text-xs text-gray-400 mb-2">🏆 Prize Statistics</p>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-2xl font-bold text-yellow-400">{prizeStats.firstPlace}</p>
                        <p className="text-xs text-gray-400">1st Place</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-gray-300">{prizeStats.secondPlace}</p>
                        <p className="text-xs text-gray-400">2nd Place</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-400">{prizeStats.totalPrize.toLocaleString()}</p>
                        <p className="text-xs text-gray-400">{prizeStats.currency}</p>
                      </div>
                    </div>
                  </div>
                )}

                {prizeStats.totalWins === 0 && (
                  <div className="p-3 rounded-lg bg-white/5 text-center">
                    <p className="text-gray-400 text-sm">🎯 No prizes won yet. Keep playing!</p>
                  </div>
                )}

                {/* FID */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                  <div>
                    <p className="text-xs text-gray-400">Farcaster ID (FID)</p>
                    <p className="font-mono font-bold text-orange-400">{user.fid}</p>
                  </div>
                  <button
                    onClick={() => copyToClipboard(String(user.fid))}
                    className="px-3 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition"
                  >
                    📋 Copy
                  </button>
                </div>

                {/* Username */}
                {user.username && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-xs text-gray-400">Username</p>
                      <p className="font-medium">@{user.username}</p>
                    </div>
                    <a
                      href={`https://warpcast.com/${user.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30 transition"
                    >
                      🔗 Warpcast
                    </a>
                  </div>
                )}

                {/* Connected Wallet */}
                {address && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-xs text-gray-400">Connected Wallet</p>
                      <p className="font-mono text-sm text-green-400">
                        {address.slice(0, 6)}...{address.slice(-4)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(address)}
                      className="px-3 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition"
                    >
                      📋 Copy
                    </button>
                  </div>
                )}

                {/* Custody Address */}
                {user.custodyAddress && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                      <p className="text-xs text-gray-400">Custody Address</p>
                      <p className="font-mono text-sm">
                        {user.custodyAddress.slice(0, 6)}...{user.custodyAddress.slice(-4)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(user.custodyAddress!)}
                      className="px-3 py-1 text-xs bg-white/10 rounded hover:bg-white/20 transition"
                    >
                      📋 Copy
                    </button>
                  </div>
                )}

                {/* Verified Addresses */}
                {user.verifiedAddresses && user.verifiedAddresses.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-xs text-gray-400 mb-2">Verified Addresses</p>
                    <div className="space-y-2">
                      {user.verifiedAddresses.slice(0, 3).map((addr, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <p className="font-mono text-xs">
                            {addr.slice(0, 6)}...{addr.slice(-4)}
                          </p>
                          <button
                            onClick={() => copyToClipboard(addr)}
                            className="text-xs text-gray-400 hover:text-white"
                          >
                            📋
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
