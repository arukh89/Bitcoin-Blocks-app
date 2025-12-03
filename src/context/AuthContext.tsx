'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import sdk from '@farcaster/miniapp-sdk'
import type { User } from '@/types/game'

// Admin lists from env (safe parsing; do not crash UI if missing)
const FIDS_RAW = process.env.NEXT_PUBLIC_ADMIN_FIDS
const WALLETS_RAW = process.env.NEXT_PUBLIC_ADMIN_WALLETS

function parseAdminFids(raw?: string): number[] {
  if (!raw) {
    if (typeof window !== 'undefined') console.warn('Missing env: NEXT_PUBLIC_ADMIN_FIDS (defaulting to empty)')
    return []
  }
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(n => Number(n))
    .filter(n => Number.isFinite(n) && n > 0)
}

function parseAdminWallets(raw?: string): string[] {
  if (!raw) {
    if (typeof window !== 'undefined') console.warn('Missing env: NEXT_PUBLIC_ADMIN_WALLETS (defaulting to empty)')
    return []
  }
  return raw
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => /^0x[a-f0-9]{40}$/.test(s))
}

export const ADMIN_FIDS: number[] = parseAdminFids(FIDS_RAW)

export function isAdminFid(fid: number): boolean {
  return ADMIN_FIDS.includes(fid)
}

export const ADMIN_WALLETS: string[] = parseAdminWallets(WALLETS_RAW)

export function isAdminWallet(address: string): boolean {
  if (!address) return false
  const a = address.toLowerCase()
  return ADMIN_WALLETS.includes(a)
}

export type AuthMode = 'farcaster-sdk' | 'neynar' | 'wallet'

interface AuthContextType {
  user: User | null
  userFid: number | null
  authMode: AuthMode | null
  isAuthenticated: boolean
  isInFarcaster: boolean
  signInWithNeynar: () => Promise<void>
  signInWithWallet: (address: string) => Promise<void>
  signOut: () => void
  logout: () => void
  walletAddress: string | null
  walletChain: 'base' | 'arbitrum' | null
  setWalletChain: (chain: 'base' | 'arbitrum') => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userFid, setUserFid] = useState<number | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [isInFarcaster, setIsInFarcaster] = useState<boolean>(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletChain, setWalletChain] = useState<'base' | 'arbitrum' | null>(null)

  // ===========================================
  // FARCASTER SDK AUTO-LOGIN (Mini App Context)
  // ===========================================
  useEffect(() => {
    const initFarcaster = async (): Promise<void> => {
      try {
        console.log('🟣 Initializing Farcaster SDK...')
        await sdk.actions.ready()
        const context = await sdk.context
        console.log('✅ Farcaster SDK ready:', context)
        
        setIsInFarcaster(true)
        
        // Auto-login with Farcaster user data
        if (context.user) {
          const fid = context.user.fid
          const isAdmin = isAdminFid(fid)
          
          console.log('👤 Auto-login with Farcaster user:', {
            fid,
            username: context.user.username,
            isAdmin
          })
          
          const farcasterUser: User = {
            address: `fid-${fid}`,
            username: context.user.username || `user${fid}`,
            displayName: context.user.displayName || context.user.username || 'Anonymous',
            pfpUrl: context.user.pfpUrl || 'https://i.imgur.com/placeholder.jpg',
            isAdmin
          }
          
          setUser(farcasterUser)
          setUserFid(fid)
          setAuthMode('farcaster-sdk')
          console.log('✅ Farcaster SDK auto-login successful')
        }
      } catch (error) {
        console.log('ℹ️ Not in Farcaster context (web mode)')
        setIsInFarcaster(false)
      }
    }

    initFarcaster()
  }, [])

  // ===========================================
  // NEYNAR SIGN IN (Web Context)
  // ===========================================
  const signInWithNeynar = useCallback(async (): Promise<void> => {
    try {
      console.log('🔐 Starting Neynar authentication...')
      
      // Generate auth URL and redirect
      // This will be implemented in SignInButton component
      // using @neynar/react SDK
      
      setAuthMode('neynar')
    } catch (error) {
      console.error('❌ Neynar auth failed:', error)
      throw error
    }
  }, [])

  // ===========================================
  // WALLET SIGN IN (Onchain Base/Arbitrum)
  // ===========================================
  const signInWithWallet = useCallback(async (address: string): Promise<void> => {
    try {
      console.log('💰 Wallet sign in:', address)

      // base wallet identity (fallback if no Farcaster match)
      const short = `${address.slice(0, 6)}...${address.slice(-4)}`
      const walletIsAdmin = isAdminWallet(address)
      const baseUser: User = {
        address,
        username: short,
        displayName: short,
        pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        isAdmin: walletIsAdmin,
      }

      setWalletAddress(address)
      setWalletChain(walletChain || 'base') // Default to base if not set
      setAuthMode('wallet')

      // Try resolve wallet -> Farcaster
      try {
        const url = `/api/farcaster/resolve-by-address?address=${encodeURIComponent(address)}`
        const res = await fetch(url)
        if (res.ok) {
          const data: any = await res.json()
          if (data?.found && data?.fid) {
            const fid: number = Number(data.fid)
            const username: string = data.username || `user${fid}`
            const pfpUrl: string = data.pfpUrl || baseUser.pfpUrl
            const userFromFarcaster: User = {
              address: `fid-${fid}`,
              username,
              displayName: data.displayName || username,
              pfpUrl,
              isAdmin: walletIsAdmin || isAdminFid(fid),
            }
            setUser(userFromFarcaster)
            setUserFid(fid)
            console.log('🔗 Resolved wallet -> Farcaster identity:', { fid, username })
            return
          }
        }
      } catch (e) {
        console.warn('Resolver failed, using wallet identity', e)
      }

      // Fallback to plain wallet identity
      setUser(baseUser)
      setUserFid(null)
      console.log('✅ Wallet authentication successful (no Farcaster linkage)')
    } catch (error) {
      console.error('❌ Wallet auth failed:', error)
      throw error
    }
  }, [walletChain])

  // ===========================================
  // SIGN OUT
  // ===========================================
  const signOut = useCallback((): void => {
    setUser(null)
    setUserFid(null)
    setAuthMode(null)
    setWalletAddress(null)
    setWalletChain(null)
    console.log('👋 User signed out')
  }, [])

  const logout = useCallback((): void => {
    signOut()
  }, [signOut])

  const value: AuthContextType = {
    user,
    userFid,
    authMode,
    isAuthenticated: !!user,
    isInFarcaster,
    signInWithNeynar,
    signInWithWallet,
    signOut,
    logout,
    walletAddress,
    walletChain,
    setWalletChain
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
