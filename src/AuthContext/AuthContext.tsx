'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import sdk from '@farcaster/miniapp-sdk'
import type { User } from '@/types/game'

// Admin Farcaster FIDs
export const ADMIN_FIDS = [
  250704,  // ukhy89
  1107084  // miggles.eth
]

export function isAdminFid(fid: number): boolean {
  return ADMIN_FIDS.includes(fid)
}

// Admin Wallet Addresses (lowercased)
export const ADMIN_WALLETS: string[] = [
  '0x09d02d25d0d082f7f2e04b4838cefe271b2dab09',
  '0xc38b1633e152fc75da3ff737717c0da5ef291408'
]

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
  // Attempts to hydrate auth state from Farcaster mini app context.
  // Returns true if a Farcaster user was found and set.
  hydrateFromFarcaster: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [userFid, setUserFid] = useState<number | null>(null)
  const [authMode, setAuthMode] = useState<AuthMode | null>(null)
  const [isInFarcaster, setIsInFarcaster] = useState<boolean>(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [walletChain, setWalletChain] = useState<'base' | 'arbitrum' | null>(null)

  // ===========================================
  // FARCASTER SDK AUTO-LOGIN (Mini App Context)
  // ===========================================
  const hydrateFromFarcaster = useCallback(async (): Promise<boolean> => {
    try {
      await sdk.actions.ready()
      const context = await sdk.context
      // Mark that we are running inside Farcaster mini app (context resolved)
      setIsInFarcaster(true)
      if (context?.user) {
        const fid = context.user.fid
        const isAdmin = isAdminFid(fid)
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
        console.log('✅ Hydrated user from Farcaster context:', { fid, isAdmin })
        return true
      }
      return false
    } catch (error) {
      // Do not force isInFarcaster=false here; allow retries from hooks/page once SDK becomes ready
      console.log('ℹ️ Farcaster SDK not ready yet or not in mini app:', error)
      return false
    }
  }, [])

  useEffect(() => {
    // Initial attempt on mount; additional retries are handled by useQuickAuth
    void hydrateFromFarcaster()
  }, [hydrateFromFarcaster])

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
      
      // Create user from wallet address
      const walletUser: User = {
        address,
        username: `${address.slice(0, 6)}...${address.slice(-4)}`,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
        pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        // Wallet admins can access Admin UI; announcements remain FID-only in UI logic
        isAdmin: isAdminWallet(address)
      }
      
      setUser(walletUser)
      setWalletAddress(address)
      setAuthMode('wallet')
      setWalletChain(walletChain || 'base') // Default to base if not set
      
      console.log('✅ Wallet authentication successful')
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
    setWalletChain,
    hydrateFromFarcaster
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
