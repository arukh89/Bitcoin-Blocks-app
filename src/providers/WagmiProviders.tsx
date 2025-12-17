"use client"

import React, { useMemo } from "react"
import { WagmiProvider, createConfig } from "wagmi"
import { base, baseSepolia } from "viem/chains"
import { http } from "viem"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { OnchainKitProvider } from '@coinbase/onchainkit'

// Export a singleton QueryClient to avoid duplicate caches
const queryClient = new QueryClient()

// Handle comma-separated chain IDs (take first one) or single value
const chainIdEnv = process.env.NEXT_PUBLIC_CHAIN_ID || String(base.id)
const CHAIN_ID = Number(chainIdEnv.split(',')[0].trim()) || base.id
const SELECTED_CHAIN = CHAIN_ID === baseSepolia.id ? baseSepolia : base

// Minimal wagmi config - NO connectors to avoid auto-connect issues
// Auth is handled by ethereum-provider.ts directly
export const config = createConfig({
  chains: [SELECTED_CHAIN],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [], // Empty - we handle wallet connection manually
  ssr: true,
})

export function WagmiProviders({ children }: { children: React.ReactNode }) {
  const qc = useMemo(() => queryClient, [])
  
  return (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={qc}>
        <OnchainKitProvider
          chain={SELECTED_CHAIN}
          config={{ appearance: { mode: 'dark' } }}
        >
          {children}
        </OnchainKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
