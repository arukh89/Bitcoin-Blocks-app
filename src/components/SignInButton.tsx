'use client'

import { useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useAccount, useConnect, useDisconnect } from 'wagmi'

export function SignInButton() {
  const { user, isInFarcaster, signOut, signInWithWallet } = useAuth()
  const { toast } = useToast()
  const isResolving = useRef<boolean>(false)

  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { connectAsync, connectors, isPending } = useConnect()
  const { disconnectAsync } = useDisconnect()

  // Find the right connector based on environment
  const getConnector = () => {
    // In Farcaster mini app: use Farcaster/Warplet connector
    if (isInFarcaster) {
      const farcasterConnector = connectors.find(
        (c) => /farcaster/i.test(c.name) || /mini.?app/i.test(c.name) || /warp/i.test(c.name)
      )
      if (farcasterConnector) return farcasterConnector
    }
    
    // On web: use injected wallet (MetaMask, etc.)
    const injectedConnector = connectors.find(
      (c) => /injected/i.test(c.id) || /metamask/i.test(c.id)
    )
    if (injectedConnector) return injectedConnector
    
    // Fallback to first available
    return connectors[0]
  }

  const handleSignIn = async (): Promise<void> => {
    if (isResolving.current || isPending) return
    
    try {
      isResolving.current = true
      
      const connector = getConnector()
      if (!connector) {
        toast({
          title: 'No Wallet Found',
          description: 'Please install a wallet extension',
          variant: 'destructive'
        })
        return
      }

      console.log('🔐 Connecting with:', connector.name)
      
      // Connect wallet
      const result = await connectAsync({ connector })
      const walletAddress = result.accounts[0]
      
      if (!walletAddress) {
        throw new Error('No address returned from wallet')
      }

      console.log('✅ Wallet connected:', walletAddress)
      
      // Resolve wallet to Farcaster identity
      await signInWithWallet(walletAddress)
      
      toast({
        title: 'Signed In',
        description: 'Welcome to Bitcoin Blocks!'
      })
    } catch (error: any) {
      console.error('Sign in failed:', error)
      // Don't show error for user rejection
      if (!error?.message?.includes('rejected') && !error?.message?.includes('denied')) {
        toast({
          title: 'Sign In Failed',
          description: error?.message || 'Could not connect wallet',
          variant: 'destructive'
        })
      }
    } finally {
      isResolving.current = false
    }
  }

  const handleSignOut = async (): Promise<void> => {
    try {
      // Sign out from auth context
      signOut()
      
      // Disconnect wallet
      if (isConnected) {
        await disconnectAsync()
      }
      
      toast({
        title: 'Signed Out',
        description: 'See you next time!'
      })
    } catch (error) {
      console.error('Sign out error:', error)
      // Force sign out even if disconnect fails
      signOut()
    }
  }

  // If authenticated - show user info and sign out button
  if (user) {
    return (
      <Button 
        onClick={handleSignOut} 
        variant="outline" 
        className="glass-card text-white border-green-500/50 hover:bg-green-500/20"
      >
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.pfpUrl} alt={user.username} />
            <AvatarFallback>{user.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <span>{user.username}</span>
          <span className="opacity-60">• Sign Out</span>
        </div>
      </Button>
    )
  }

  // Not authenticated - show sign in button
  return (
    <Button
      onClick={handleSignIn}
      disabled={isPending || isResolving.current}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg"
    >
      {isPending ? '⏳ Connecting...' : '🔐 Sign In'}
    </Button>
  )
}
