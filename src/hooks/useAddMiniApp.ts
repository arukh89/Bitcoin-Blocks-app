"use client"
import { useCallback } from "react"

export function useAddMiniApp() {
  const addMiniApp = useCallback(async () => {
    // No-op placeholder to avoid build errors; integrate Farcaster SDK if needed.
    return
  }, [])

  return { addMiniApp }
}
