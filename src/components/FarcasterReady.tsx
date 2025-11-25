"use client"
import { useEffect } from "react"
import { sdk } from "@farcaster/miniapp-sdk"

// Call sdk.actions.ready() as early as possible so the desktop/web client
// dismisses its splash screen. Safe to call outside Farcaster context.
export default function FarcasterReady() {
  useEffect(() => {
    const init = async () => {
      try {
        await sdk.actions.ready()
      } catch {
        // Ignore when not running inside a Farcaster client
      }
    }
    void init()
  }, [])
  return null
}
