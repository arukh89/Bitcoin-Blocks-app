'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import sdk from '@farcaster/miniapp-sdk'
import type { User } from '@/types/game'

// Re-export admin utilities from shared constants
export {
  ADMIN_FIDS,
  ADMIN_WALLETS,
  isAdminFid,
  isAdminWallet,
  isAdminUser
} from '@/lib/admin-constants'

import { isAdminFid, isAdminWallet } from '@/lib/admin-constants'

// Only 2 auth modes: farcaster or wallet
export type AuthMode = 'farcaster' | 'wallet'

// Platform detection
export type Platform = 'farcaster' | 'base-app' | 'web'

interface FarcasterUserData {
  fid: number
  username?: string
  displayName?: string
  pfpUrl?: string
  custodyAddress?: string
  verifications?: string[]
}

interface AuthContextType {
  user: User | null
  userFid: number | null
  authMode: AuthMode | null
  isAuthenticated: boolean
  isInFarcaster: boolean
  isInBaseApp: boolean
  platform: Platform
  signInWithFarcaster: (userData: FarcasterUserData) => void
  signInWithWallet: (address: string) => Promise<void>
  signOut: () => void
  walletAddress: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userFid, setUserFid] = useState<number | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [isInFarcaster, setIsInFarcaster] = useState<boolean>(false)
  const [isInBaseApp, setIsInBaseApp] = useState<boolean>(false)
  const [platform, setPlatform] = useState<Platform>('web')
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Detect platform: Farcaster, Base App, or Web
  useEffect(() => {
    const detectPlatform = async (): Promise<void> => {
      // Check for Base App first
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''
      const hasCoinbase = typeof window !== 'undefined' && !!(window as any).coinbaseWalletExtension
      
      if (ua.includes('base') || ua.includes('coinbase') || hasCoinbase) {
        console.log('🔵 Running in Base App')
        setIsInBaseApp(true)
        setPlatform('base-app')
        return
      }

      // Check for Farcaster
      try {
        await sdk.actions.ready()
        const context = await sdk.context
        if (context) {
          console.log('🟣 Running in Farcaster mini app')
          setIsInFarcaster(true)
          setPlatform('farcaster')
          return
        }
      } catch {
        // Not in Farcaster
      }

      console.log('🌐 Running in web browser')
      setPlatform('web')
    }
    detectPlatform()
  }, [])

  // Sign in with Farcaster (from Quick Auth)
  const signInWithFarcaster = useCallback((userData: FarcasterUserData): void => {
    const fid = userData.fid
    const isAdmin = isAdminFid(fid)
    
    const farcasterUser: User = {
      address: `fid-${fid}`,
      username: userData.username || `user${fid}`,
      displayName: userData.displayName || userData.username || `User ${fid}`,
      pfpUrl: userData.pfpUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=fid-${fid}`,
      isAdmin
    }
    
    setUser(farcasterUser)
    setUserFid(fid)
    setAuthMode('farcaster')
    
    // Store wallet address if available
    if (userData.custodyAddress) {
      setWalletAddress(userData.custodyAddress)
    } else if (userData.verifications?.length) {
      setWalletAddress(userData.verifications[0])
    }
    
    console.log('✅ Signed in with Farcaster:', { fid, username: farcasterUser.username })
  }, [])

  // Sign in with wallet (for web users without Farcaster)
  const signInWithWallet = useCallback(async (address: string): Promise<void> => {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`
    const isAdmin = isAdminWallet(address)
    
    setWalletAddress(address)
    setAuthMode('wallet')

    // Try to resolve wallet to Farcaster identity
    try {
      const res = await fetch(`/api/farcaster/resolve-by-address?address=${encodeURIComponent(address)}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.found && data?.fid) {
          const fid = Number(data.fid)
          const walletUser: User = {
            address: `fid-${fid}`,
            username: data.username || `user${fid}`,
            displayName: data.displayName || data.username || short,
            pfpUrl: data.pfpUrl || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
            isAdmin: isAdmin || isAdminFid(fid)
          }
          setUser(walletUser)
          setUserFid(fid)
          console.log('✅ Wallet resolved to Farcaster:', { fid, username: walletUser.username })
          return
        }
      }
    } catch (e) {
      console.warn('Wallet resolve failed:', e)
    }

    // Fallback: wallet-only identity
    const walletUser: User = {
      address,
      username: short,
      displayName: short,
      pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
      isAdmin
    }
    setUser(walletUser)
    setUserFid(null)
    console.log('✅ Signed in with wallet:', address)
  }, [])

  // Sign out
  const signOut = useCallback((): void => {
    setUser(null)
    setUserFid(null)
    setAuthMode(null)
    setWalletAddress(null)
    console.log('👋 Signed out')
  }, [])

  const value: AuthContextType = {
    user,
    userFid,
    authMode,
    isAuthenticated: !!user,
    isInFarcaster,
    isInBaseApp,
    platform,
    signInWithFarcaster,
    signInWithWallet,
    signOut,
    walletAddress
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
