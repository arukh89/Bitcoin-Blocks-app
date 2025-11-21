"use client"
import { useEffect, useRef } from "react"
import { useAuth } from "@/context/AuthContext"

// Attempts to quickly hydrate Farcaster auth in mini app context with retries
export function useQuickAuth(isInFarcaster: boolean) {
  const { user, hydrateFromFarcaster } = useAuth()
  const startedRef = useRef(false)

  useEffect(() => {
    if (!isInFarcaster) return
    if (user) return
    if (startedRef.current) return
    startedRef.current = true

    let cancelled = false
    const run = async () => {
      const maxAttempts = 5
      for (let i = 0; i < maxAttempts && !cancelled; i++) {
        const ok = await hydrateFromFarcaster()
        if (ok) break
        // Exponential backoff: 300ms, 600ms, 900ms, ...
        const delay = 300 * (i + 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    void run()

    return () => { cancelled = true }
    // We intentionally avoid re-running when user changes, to prevent loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInFarcaster, hydrateFromFarcaster])
}
