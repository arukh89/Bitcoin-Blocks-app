'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import type { User } from '@/types/game'

// Admin Farcaster FIDs (no hardcode). Provide CSV in env: NEXT_PUBLIC_ADMIN_FIDS="123,456"
const ADMIN_FIDS: number[] = (process.env.NEXT_PUBLIC_ADMIN_FIDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(n => Number(n))
  .filter(n => Number.isFinite(n))

export function isAdminFid(fid: number): boolean {
  return ADMIN_FIDS.includes(fid)
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
  walletAddress: string | null
  walletChain: 'base' | 'arbitrum' | null
  setWalletChain: (chain: 'base' | 'arbitrum') => void
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
      
      // Create user from wallet address
      const walletUser: User = {
        address,
        username: `${address.slice(0, 6)}...${address.slice(-4)}`,
        displayName: `${address.slice(0, 6)}...${address.slice(-4)}`,
        pfpUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${address}`,
        isAdmin: false
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

  const value: AuthContextType = {
    user,
    userFid,
    authMode,
    isAuthenticated: !!user,
    isInFarcaster,
    signInWithNeynar,
    signInWithWallet,
    signOut,
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
