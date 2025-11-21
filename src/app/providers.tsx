'use client'

import { type ReactNode, useMemo, useState } from 'react'
import { WagmiProvider, createConfig, http } from 'wagmi'
import { base, arbitrum } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { AuthProvider } from '@/context/AuthContext'
import { GameProvider } from '@/context/GameContext'
import '@rainbow-me/rainbowkit/styles.css'

export function Providers({ children }: { children: ReactNode }): JSX.Element {
  // Create QueryClient on client only
  const [queryClient] = useState(() => new QueryClient())

  // Build wagmi config on client to avoid SSR touching storage/indexedDB
  const wagmiConfig = useMemo(() => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'
    return createConfig({
      chains: [base, arbitrum],
      connectors: [
        injected(),
        walletConnect({ projectId }),
        coinbaseWallet({ appName: 'Bitcoin Blocks' })
      ],
      transports: {
        [base.id]: http(),
        [arbitrum.id]: http()
      }
    })
  }, [])

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <AuthProvider>
            <GameProvider>
              {children}
            </GameProvider>
          </AuthProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
