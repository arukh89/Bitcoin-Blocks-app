'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAuth } from '@/context/AuthContext'
import { motion } from 'framer-motion'
import type { User } from '@/types/game'
import sdk from '@farcaster/miniapp-sdk'
import { useDisconnect } from 'wagmi'

export function AuthButton(): JSX.Element {
  const { user, signInWithWallet, logout } = useAuth()
  const { disconnect } = useDisconnect()
  const [loading, setLoading] = useState<boolean>(false)
  const [isHovered, setIsHovered] = useState<boolean>(false)

  const handleConnect = async (): Promise<void> => {
    try {
      setLoading(true)
      
      // Check if in mock mode (development/testing)
      const isMockMode = process.env.NODE_ENV === 'development' || window.location.hostname === 'localhost'
      
      if (isMockMode) {
        console.log('🎯 [MOCK MODE] Auto-connecting as admin...')
        const adminAddress = '0x09D02D25D0D082f7F2E04b4838cEfe271b2daB09'
        await signInWithWallet(adminAddress)
        console.log('✅ [MOCK MODE] Connected as admin:', adminAddress)
        return
      }
      
      // Production mode: Request wallet connection using Farcaster miniapp SDK
      const wallet = await sdk.wallet.ethProvider.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (!wallet || wallet.length === 0) {
        throw new Error('No wallet connected')
      }

      const address = wallet[0]
      
      // Get user context from Farcaster
      const context = await sdk.context

      await signInWithWallet(address)
    } catch (error) {
      console.error('Failed to connect wallet:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Button disabled className="animate-pulse">
        Connecting...
      </Button>
    )
  }

  if (!user) {
    return (
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onClick={handleConnect}
          className="bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 text-white font-bold shadow-lg"
        >
          🔗 Connect
        </Button>
      </motion.div>
    )
  }

  const handleSignOutClick = (): void => {
    try { if (typeof window !== 'undefined') window.sessionStorage.setItem('bb_skip_auto_wallet', '1') } catch {}
    disconnect()
    logout()
  }

  return (
    <motion.div
      className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500/20 to-purple-500/20 backdrop-blur-xl border border-white/20 shadow-lg"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02, boxShadow: "0 0 25px rgba(255, 120, 0, 0.3)" }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        animate={isHovered ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Avatar className="h-10 w-10 ring-2 ring-orange-400 ring-offset-2 ring-offset-transparent">
          <AvatarImage src={user.pfpUrl} alt={user.username} />
          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-purple-600 text-white">
            {user.username[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </motion.div>
      <div className="flex flex-col">
        <span className="text-sm font-bold text-white">@{user.username}</span>
        <span className="text-xs text-orange-300 font-mono">{user.address.slice(0, 6)}...{user.address.slice(-4)}</span>
      </div>
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button onClick={handleSignOutClick} variant="outline" className="ml-2 border-orange-400/50 text-orange-200 hover:bg-orange-500/20">
          Sign Out
        </Button>
      </motion.div>
    </motion.div>
  )
}
