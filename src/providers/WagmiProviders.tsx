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

const CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || base.id)
const SELECTED_CHAIN = CHAIN_ID === baseSepolia.id ? baseSepolia : base

export const config = createConfig({
  chains: [SELECTED_CHAIN],
  transports: { [SELECTED_CHAIN.id]: http() },
  connectors: [miniAppConnector(), injected()],
  ssr: true,
  multiInjectedProviderDiscovery: true,
})

function AutoConnect() {
  const { isConnected } = useAccount()
  const { connectors, connectAsync } = useConnect()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (isConnected) return
      try {
        const sdk = (await import("@farcaster/miniapp-sdk")).default
        // Ensure we're actually in Farcaster Mini App; will throw on web
        await sdk.actions.ready()
        // Prefer injected when available; in mini app, this binds to Farcaster provider + Warplet overlay
        const injected = connectors.find((c) => c.id === "injected") || connectors[0]
        if (!injected || cancelled) return
        await connectAsync({ connector: injected })
      } catch {
        // no-op on web if Farcaster SDK not present / not in mini app
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isConnected, connectors, connectAsync])

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
