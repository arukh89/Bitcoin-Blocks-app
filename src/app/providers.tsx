"use client"

import type React from "react"
import { useEffect, useMemo } from "react"
import { WagmiProvider, createConfig } from "wagmi"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector"
import { base } from "viem/chains"
import { http } from "viem"
import { useAccount, useConnect } from "wagmi"
import { GameProvider } from "@/context/GameContext"

const queryClient = new QueryClient()

const config = createConfig({
  chains: [base],
  transports: { [base.id]: http() },
  connectors: [miniAppConnector()],
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
        const { sdk } = await import("@farcaster/miniapp-sdk")
        const inMiniApp = await sdk.isInMiniApp().catch(() => false)
        if (!inMiniApp) return
        const injectedConn =
          connectors.find((c) => c.id === "injected" || c.name.toLowerCase().includes("injected")) ||
          connectors[0]
        if (!injectedConn) return
        if (cancelled) return
        await connectAsync({ connector: injectedConn })
      } catch {
        // ignore
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
