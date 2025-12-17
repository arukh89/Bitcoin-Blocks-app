'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import sdk from '@farcaster/miniapp-sdk'
import { getEthereumProvider } from '@/lib/ethereum-provider'

export function SignInButton() {
  const { user, isInFarcaster, isInBaseApp, platform, signOut, signInWithFarcaster, signInWithWallet } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignIn = useCallback(async (): Promise<void> => {
    if (isLoading) return
    setIsLoading(true)

    try {
      if (isInFarcaster) {
        // In Farcaster mini app: get user from SDK context
        console.log('🟣 Getting Farcaster user from SDK context...')
        
        const context = await sdk.context
        
        if (context?.user) {
          signInWithFarcaster({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl
          })
          toast({ title: 'Signed In', description: `Welcome, ${context.user.username || 'User'}!` })
        } else {
          throw new Error('No user in Farcaster context')
        }
      } else {
        // On Base App or Web: use wallet provider
        console.log(`🔗 Connecting wallet on ${platform}...`)
        
        const provider = await getEthereumProvider()
        const accounts = await provider.request({ method: 'eth_requestAccounts' })
        const address = accounts[0]
        
        if (address) {
          await signInWithWallet(address)
          toast({ title: 'Signed In', description: 'Welcome!' })
        }
      }
    } catch (error: any) {
      console.error('Sign in failed:', error)
      if (!error?.message?.includes('rejected') && !error?.message?.includes('denied')) {
        toast({
          title: 'Sign In Failed',
          description: error?.message || 'Could not sign in',
          variant: 'destructive'
        })
      }
    } finally {
      setIsLoading(false)
    }
  }, [isInFarcaster, isInBaseApp, platform, isLoading, signInWithFarcaster, signInWithWallet, toast])

  const handleSignOut = useCallback((): void => {
    signOut()
    toast({ title: 'Signed Out', description: 'See you next time!' })
  }, [signOut, toast])

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

  // Not authenticated - show sign in button with platform-specific label
  const getButtonLabel = () => {
    if (isLoading) return '⏳ Signing In...'
    if (isInFarcaster) return '🟣 Sign In'
    if (isInBaseApp) return '🔵 Connect Base'
    return '🦊 Connect Wallet'
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={isLoading}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg"
    >
      {getButtonLabel()}
    </Button>
  )
}
