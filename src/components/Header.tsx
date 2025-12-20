'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDisconnect } from 'wagmi';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import { useIsInFarcaster } from '@/hooks/useIsInFarcaster';
import { isAdminFid } from '@/config/app-config';
import { ConnectWallet } from './ConnectWallet';
import { UserProfilePopup } from './UserProfilePopup';
import { ChainSelector } from './ChainSelector';

export function Header() {
  const { user, loading } = useFarcasterUser();
  const isInFarcaster = useIsInFarcaster();
  const { disconnect } = useDisconnect();
  const userIsAdmin = isAdminFid(user?.fid);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fc_fid');
      localStorage.removeItem('fc_user');
    }
    disconnect();
    setShowDropdown(false);
    window.location.reload();
  };

  const handleOpenProfile = () => {
    setShowDropdown(false);
    setShowProfile(true);
  };

  return (
    <>
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
          {/* Chain Selector */}
          <ChainSelector />

          {/* Platform badge */}
          <span className="px-2 py-1 text-xs rounded-full bg-white/10">
            {isInFarcaster ? '🟣 Farcaster' : '🌐 Browser'}
          </span>

          {/* User Menu */}
          {loading ? (
            <div className="px-4 py-2 rounded-full bg-yellow-500/20 border border-yellow-500/30">
              <span className="text-sm text-yellow-400">Loading...</span>
            </div>
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              {/* User Button */}
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-purple-500/20 border border-green-500/30 hover:border-green-500/50 transition"
              >
                {user.pfpUrl && (
                  <img src={user.pfpUrl} alt="" className="w-6 h-6 rounded-full" />
                )}
                <span className="text-sm text-green-400">
                  @{user.username || `fid:${user.fid}`}
                </span>
                {userIsAdmin && <span className="text-xs">👑</span>}
                <span className="text-xs ml-1">▼</span>
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl z-50 overflow-hidden"
                  >
                    {/* User Info Header */}
                    <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-orange-500/10">
                      <div className="flex items-center gap-3">
                        {user.pfpUrl ? (
                          <img src={user.pfpUrl} alt="" className="w-10 h-10 rounded-full" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                            👤
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">
                            {user.displayName || user.username}
                          </p>
                          <p className="text-xs text-gray-400">FID: {user.fid}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="py-2">
                      <button
                        onClick={handleOpenProfile}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-white/10 transition flex items-center gap-3"
                      >
                        <span className="text-lg">👤</span>
                        <span>View Profile</span>
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-red-500/20 text-red-400 transition flex items-center gap-3"
                      >
                        <span className="text-lg">🚪</span>
                        <span>Logout</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : !isInFarcaster ? (
            <ConnectWallet />
          ) : (
            <div className="px-4 py-2 rounded-full bg-gray-500/20 border border-gray-500/30">
              <span className="text-sm text-gray-400">Not connected</span>
            </div>
          )}
        </div>
      </motion.header>

      {/* Profile Popup */}
      {user && (
        <UserProfilePopup
          user={user}
          isOpen={showProfile}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
}
