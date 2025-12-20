'use client';

import { useState, useEffect } from 'react';
import type { Platform } from '@/types';

declare global {
  interface Window {
    ethereum?: {
      isCoinbaseWallet?: boolean;
      isMetaMask?: boolean;
    };
  }
}

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('browser');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function detectPlatform() {
      try {
        // Check if running in Farcaster Mini App context
        const { sdk } = await import('@farcaster/miniapp-sdk');
        const inMiniApp = await sdk.isInMiniApp().catch(() => false);
        
        if (inMiniApp) {
          setPlatform('farcaster');
          setIsLoading(false);
          return;
        }
      } catch {
        // Not in Farcaster context
      }

      // Check if Coinbase Wallet (Base App)
      if (typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet) {
        setPlatform('base');
      } else {
        setPlatform('browser');
      }
      
      setIsLoading(false);
    }

    detectPlatform();
  }, []);

  return { platform, isLoading };
}
