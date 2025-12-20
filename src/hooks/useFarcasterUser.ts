"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount } from "wagmi"
import { fetchUserByFid, fetchUserByAddress, type FarcasterUserData } from "@/lib/neynar"

export interface FarcasterUser {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  custodyAddress?: string
  verifiedAddresses?: string[]
}

function safeNumber(val: unknown): number | null {
  if (val == null) return null
  if (typeof val === "number" && Number.isFinite(val)) return Math.trunc(val)
  if (typeof val === "string") {
    const n = parseInt(val, 10)
    return Number.isFinite(n) ? n : null
  }
  return null
}

function safeString(val: unknown): string | undefined {
  if (val == null) return undefined
  if (typeof val === "string") return val
  return undefined
}

function saveUserToStorage(user: FarcasterUser) {
  try {
    if (typeof window === "undefined") return
    localStorage.setItem("fc_fid", String(user.fid))
    localStorage.setItem("fc_user", JSON.stringify({
      fid: user.fid,
      username: user.username,
      displayName: user.displayName,
      pfpUrl: user.pfpUrl,
    }))
  } catch {}
}

function readUserFromStorage(): FarcasterUser | null {
  try {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("fc_user")
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed?.fid && typeof parsed.fid === "number") {
        return {
          fid: parsed.fid,
          username: safeString(parsed.username),
          displayName: safeString(parsed.displayName),
          pfpUrl: safeString(parsed.pfpUrl),
        }
      }
    }
  } catch {}
  return null
}

export function useFarcasterUser() {
  const [user, setUser] = useState<FarcasterUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { address, isConnected } = useAccount()

  const loadUser = useCallback(async () => {
    let resolved: FarcasterUser | null = null
    
    try {
      if (typeof window === "undefined") {
        setLoading(false)
        return
      }

      // 1. Try Farcaster MiniApp SDK first (for Warpcast)
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk")
        
        const ctx = sdk?.context
        if (ctx?.user) {
          const fid = safeNumber(ctx.user.fid)
          if (fid) {
            resolved = {
              fid,
              username: safeString(ctx.user.username),
              displayName: safeString(ctx.user.displayName),
              pfpUrl: safeString(ctx.user.pfpUrl),
            }
          }
        }

        // Try to become ready (with timeout)
        if (!resolved) {
          try {
            await Promise.race([
              sdk.actions.ready(),
              new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 1000)),
            ])
            
            if (sdk.context?.user) {
              const fid = safeNumber(sdk.context.user.fid)
              if (fid) {
                resolved = {
                  fid,
                  username: safeString(sdk.context.user.username),
                  displayName: safeString(sdk.context.user.displayName),
                  pfpUrl: safeString(sdk.context.user.pfpUrl),
                }
              }
            }
          } catch {
            // Timeout or not in miniapp
          }
        }
      } catch {
        // Not in miniapp context
      }

      // 2. If connected wallet, lookup FID from Neynar by address
      if (!resolved && isConnected && address) {
        try {
          const neynarUser = await fetchUserByAddress(address)
          if (neynarUser?.fid) {
            resolved = {
              fid: neynarUser.fid,
              username: neynarUser.username,
              displayName: neynarUser.displayName,
              pfpUrl: neynarUser.pfpUrl,
              custodyAddress: neynarUser.custodyAddress,
              verifiedAddresses: neynarUser.verifiedAddresses,
            }
          }
        } catch (e) {
          console.warn("[useFarcasterUser] Neynar lookup failed:", e)
        }
      }

      // 3. Try localStorage
      if (!resolved) {
        const storedUser = readUserFromStorage()
        if (storedUser) {
          resolved = storedUser
        }
      }

      // 4. If we have FID but missing data, fetch from Neynar
      if (resolved?.fid && (!resolved.username || !resolved.pfpUrl)) {
        try {
          const neynarUser = await fetchUserByFid(resolved.fid)
          if (neynarUser) {
            resolved = {
              fid: resolved.fid,
              username: resolved.username || neynarUser.username,
              displayName: resolved.displayName || neynarUser.displayName,
              pfpUrl: resolved.pfpUrl || neynarUser.pfpUrl,
              custodyAddress: resolved.custodyAddress || neynarUser.custodyAddress,
              verifiedAddresses: resolved.verifiedAddresses || neynarUser.verifiedAddresses,
            }
          }
        } catch {}
      }

      // Save to storage if we have a user
      if (resolved) {
        saveUserToStorage(resolved)
      }

      setUser(resolved)
    } catch (error) {
      console.error("[useFarcasterUser] Error:", error)
    } finally {
      setLoading(false)
    }
  }, [address, isConnected])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const refresh = useCallback(() => {
    setLoading(true)
    loadUser()
  }, [loadUser])

  return { user, loading, refresh }
}
