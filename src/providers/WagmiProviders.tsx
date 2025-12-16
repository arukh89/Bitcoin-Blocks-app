"use client"

import React, { useEffect, useMemo } from "react"
import { WagmiProvider, createConfig } from "wagmi"
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector"
import { base, baseSepolia } from "viem/chains"
import { http } from "viem"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useAccount, useConnect } from "wagmi"
import { injected } from "wagmi/connectors"

// Export a singleton QueryClient to avoid duplicate caches
const queryClient = new QueryClient()

// Handle comma-separated chain IDs (take first one) or single value
const chainIdEnv = process.env.NEXT_PUBLIC_CHAIN_ID || String(base.id)
const CHAIN_ID = Number(chainIdEnv.split(',')[0].trim()) || base.id
const SELECTED_CHAIN = CHAIN_ID === baseSepolia.id ? baseSepolia : base

export const config = createConfig({
  chains: [SELECTED_CHAIN],
  transports: {
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
  connectors: [miniAppConnector(), injected()],
  ssr: true,
  multiInjectedProviderDiscovery: true,
})

// AutoConnect disabled - let user manually connect via SignInButton
// This prevents multiple wallet prompts on page load
function AutoConnect() {
  return null
}

export function WagmiProviders({ children }: { children: React.ReactNode }) {
  const qc = useMemo(() => queryClient, [])
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={qc}>
        <AutoConnect />
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
