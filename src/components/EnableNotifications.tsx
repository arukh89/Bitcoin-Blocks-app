'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { promptAddMiniApp, checkMiniAppAdded } from '@/lib/notifications';

export function EnableNotifications() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkMiniAppAdded().then(setEnabled);
  }, []);

  async function handleEnable() {
    setLoading(true);
    try {
      const added = await promptAddMiniApp();
      if (added) {
        setEnabled(true);
      }
    } catch (e) {
      console.error('[EnableNotifications] Error:', e);
    } finally {
      setLoading(false);
    }
  }

  // Still checking
  if (enabled === null) {
    return null;
  }

  // Already enabled
  if (enabled) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm">
        <span>🔔</span>
        <span>Notifications enabled</span>
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleEnable}
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition disabled:opacity-50"
    >
      {loading ? (
        <span className="animate-spin">⏳</span>
      ) : (
        <span>🔔</span>
      )}
      <span>Enable Notifications</span>
    </motion.button>
  );
}
