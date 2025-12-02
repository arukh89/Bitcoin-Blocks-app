'use client'

import { type ReactNode } from 'react'
import { AuthProvider } from '@/context/AuthContext'
import { GameProvider } from '@/context/GameContext'
import { WagmiProviders } from '@/providers/WagmiProviders'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProviders>
      <AuthProvider>
        <GameProvider>
          {children}
        </GameProvider>
      </AuthProvider>
    </WagmiProviders>
  )
}
