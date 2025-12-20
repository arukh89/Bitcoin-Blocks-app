'use client';

import { motion } from 'framer-motion';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import { useIsInFarcaster } from '@/hooks/useIsInFarcaster';
import { isAdminFid } from '@/config/app-config';

export function Header() {
  const { user, loading } = useFarcasterUser();
  const isInFarcaster = useIsInFarcaster();
  const userIsAdmin = isAdminFid(user?.fid);

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, type: 'spring' }}
      className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6"
    >
      <div>
        <h1 className="text-3xl lg:text-4xl font-bold flex items-center gap-2">
          <span>🛠️</span>
          <span className="bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
            Bitcoin Blocks
          </span>
        </h1>
        <p className="text-gray-400 text-sm">
          ● Predicting Bitcoin&apos;s Next Block
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* Platform badge */}
        <span className="px-2 py-1 text-xs rounded-full bg-white/10">
          {isInFarcaster ? '🟣 Farcaster' : '🌐 Browser'}
        </span>

        {/* User info */}
        {loading ? (
          <div className="px-3 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
            <span className="text-sm text-yellow-400">Loading...</span>
          </div>
        ) : user ? (
          <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-green-500/20 border border-green-500/30">
            {user.pfpUrl && (
              <img src={user.pfpUrl} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span className="text-sm text-green-400">
              @{user.username || `fid:${user.fid}`}
            </span>
            {userIsAdmin && <span className="text-xs">👑</span>}
          </div>
        ) : (
          <div className="px-3 py-2 rounded-full bg-gray-500/20 border border-gray-500/30">
            <span className="text-sm text-gray-400">Not connected</span>
          </div>
        )}
      </div>
    </motion.header>
  );
}
