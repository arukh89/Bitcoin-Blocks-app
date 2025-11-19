"use client"
import { useEffect, useState } from "react"

export function useIsInFarcaster(): boolean {
  const [isInFarcaster, setIsInFarcaster] = useState(false)
  useEffect(() => {
    try {
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
      const inFrame = typeof window !== 'undefined' && window.top !== window.self
      setIsInFarcaster(inFrame || ua.includes('farcaster'))
    } catch {
      setIsInFarcaster(false)
    }
  }, [])
  return isInFarcaster
}
