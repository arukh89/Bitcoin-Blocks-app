'use client'

import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAccount, useDisconnect } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useSignIn, QRCode } from '@farcaster/auth-kit'
import { base, arbitrum } from 'wagmi/chains'
import { motion } from 'framer-motion'

export function SignInButton(): JSX.Element {
  const { user, authMode, isInFarcaster, signInWithNeynar, signInWithWallet, signOut, walletChain, setWalletChain } = useAuth()
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [selectedChain, setSelectedChain] = useState<'base' | 'arbitrum'>(walletChain || 'base')
  const didAutoWalletRef = useRef(false)
  
  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()

  // Auto sign in when wallet connects (web only), guarded to avoid re-login after sign out
  useEffect(() => {
    if (didAutoWalletRef.current) return
    if (!isConnected || !address || user) return
    if (isInFarcaster) return // never auto wallet in mini app
    try {
      const skip = typeof window !== 'undefined' ? window.sessionStorage.getItem('bb_skip_auto_wallet') : null
      if (skip === '1') return
    } catch {}
    didAutoWalletRef.current = true
    void signInWithWallet(address)
  }, [isConnected, address, user, isInFarcaster, signInWithWallet])

  // Farcaster AuthKit sign-in
  const { signIn, url, isConnected: isAuthKitConnected, isSuccess, data } = useSignIn({
    onSuccess: ({ fid, username, displayName, pfpUrl }) => {
      void signInWithNeynar({ fid, username, displayName, pfpUrl })
      setShowDialog(false)
    },
  })

  // RainbowKit handles wallet connection via ConnectButton

  const handleSignOut = (): void => {
    try {
      // prevent auto wallet relogin this session
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem('bb_skip_auto_wallet', '1')
      }
    } catch {}
    signOut()
    if (isConnected) {
      disconnect()
    }
    setShowDialog(false)
  }

  // If in Farcaster context and already authenticated
  if (isInFarcaster && authMode === 'farcaster-sdk') {
    return (
      <Button
        onClick={handleSignOut}
        variant="outline"
        className="glass-card text-white border-purple-500/50 hover:bg-purple-500/20"
      >
        👤 {user?.username} • Sign Out
      </Button>
    )
  }

  // If authenticated via other methods
  if (user) {
    return (
      <Button
        onClick={() => setShowDialog(true)}
        variant="outline"
        className="glass-card text-white border-green-500/50 hover:bg-green-500/20"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {user.username}
        </div>
      </Button>
    )
  }

  // Not authenticated - show sign in button
  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold shadow-lg"
      >
        🔐 Sign In
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-gray-900 border-purple-500/30 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold gradient-text">Sign In to Bitcoin Blocks</DialogTitle>
            <DialogDescription className="text-gray-400">
              Choose your authentication method
            </DialogDescription>
          </DialogHeader>

          {/* Auth options (shown when not authenticated) */}
          <Tabs defaultValue="neynar" className="w-full">
              <TabsList className={`grid w-full ${!isInFarcaster ? 'grid-cols-2' : 'grid-cols-1'} bg-gray-800`}>
                <TabsTrigger value="neynar" className="text-white">
                  🟣 Farcaster
                </TabsTrigger>
                {!isInFarcaster && (
                  <TabsTrigger value="wallet" className="text-white">
                    💰 Wallet
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Neynar Tab */}
              <TabsContent value="neynar" className="space-y-4">
                <Card className="glass-card-dark border-purple-500/30">
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-bold mb-2">Sign in with Farcaster</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Scan QR code with your Farcaster app
                      </p>
                    </div>

                    {!url && (
                      <Button onClick={() => signIn()} className="w-full bg-purple-600 hover:bg-purple-700">
                        Generate QR Code
                      </Button>
                    )}

                    {url && (
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex justify-center p-4 bg-white rounded-xl">
                        <QRCode uri={url} size={200} />
                      </motion.div>
                    )}

                    <div className="text-xs text-gray-500 text-center">
                      Perfect for desktop browsers
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wallet Tab */}
              {!isInFarcaster && (
              <TabsContent value="wallet" className="space-y-4">
                <Card className="glass-card-dark border-blue-500/30">
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-lg font-bold mb-2">Connect Wallet</p>
                      <p className="text-sm text-gray-400">
                        Onchain authentication
                      </p>
                    </div>

                    <div className="flex justify-center">
                      <ConnectButton chainStatus="icon" showBalance={false} />
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      Supports Base & Arbitrum networks
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              )}
            </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
