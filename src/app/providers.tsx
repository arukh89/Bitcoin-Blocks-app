"use client"

import type React from "react"
import { useEffect, useMemo, useRef } from "react"
import { WagmiProvider, createConfig } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector"
import { injected, coinbaseWallet } from "wagmi/connectors"
import { base, baseSepolia, arbitrum } from "viem/chains"
import { http } from "viem"
import { useAccount, useConnect } from "wagmi"
import { GameProvider } from "@/context/GameContext"

const queryClient = new QueryClient()

// Supported chains
export const supportedChains = [base, arbitrum, baseSepolia] as const

const config = createConfig({
  chains: supportedChains,
  transports: { 
    [base.id]: http(),
    [arbitrum.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [
    miniAppConnector(), // Farcaster MiniApp / Warplet
    coinbaseWallet({
      appName: 'Bitcoin Blocks',
      preference: 'all', // 'all' | 'smartWalletOnly' | 'eoaOnly'
    }),
    injected({
      shimDisconnect: true,
    }), // MetaMask, Rabby, etc.
  ],
  ssr: true,
  multiInjectedProviderDiscovery: true,
})

function AutoConnect() {
  const { isConnected } = useAccount()
  const { connectors, connectAsync } = useConnect()
  const attemptedRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    
    // Prevent multiple connection attempts
    if (attemptedRef.current || isConnected) return
    attemptedRef.current = true
    
    ;(async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        const inMiniApp = await sdk.isInMiniApp().catch(() => false)
        if (!inMiniApp || cancelled) return
        
        // In Farcaster MiniApp, try to connect with miniapp connector first
        const miniAppConn = connectors.find((c) => c.id === 'farcasterMiniApp' || c.name === 'Farcaster MiniApp')
        if (miniAppConn && !cancelled) {
          await connectAsync({ connector: miniAppConn })
          return
        }
        
        // Fallback to injected
        const injectedConn = connectors.find((c) => c.id === 'injected')
        if (injectedConn && !cancelled) {
          await connectAsync({ connector: injectedConn })
        }
      } catch (e) {
        console.log('[AutoConnect] Failed:', e)
      }
    })()
    
    return () => {
      cancelled = true
    }
  }, [isConnected, connectors, connectAsync])
  
  return null
}

export function Providers({ children }: { children: React.ReactNode }) {
  const qc = useMemo(() => queryClient, [])

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <AutoConnect />
        <GameProvider>
          {children}
        </GameProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
