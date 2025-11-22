'use client'

import { type ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { GameProvider } from '@/context/GameContext'
import { wagmiConfig } from '@/lib/wagmi-config'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { AuthKitProvider } from '@farcaster/auth-kit'

const queryClient = new QueryClient()

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <AuthKitProvider
          config={{
            domain: typeof window !== 'undefined' ? window.location.host : undefined,
            siweUri: typeof window !== 'undefined' ? window.location.href : undefined,
            // Defaults are fine for relay and rpcUrl
          }}
        >
          <RainbowKitProvider theme={darkTheme()} modalSize="compact">
            <AuthProvider>
              <GameProvider>
                {children}
              </GameProvider>
            </AuthProvider>
          </RainbowKitProvider>
        </AuthKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
