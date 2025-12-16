'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QRCodeSVG } from 'qrcode.react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { motion } from 'framer-motion'

export function SignInButton() {
  const { user, isInFarcaster, signOut, signInWithWallet } = useAuth()
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [neynarUrl, setNeynarUrl] = useState<string>('')
  const { toast } = useToast()
  const hasAutoResolved = useRef<string | null>(null)

  // Wagmi hooks
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  // Auto-resolve wallet to Farcaster user when connected
  useEffect(() => {
    const autoResolve = async () => {
      // Only auto-resolve if:
      // 1. Wallet is connected
      // 2. We have an address
      // 3. User is not already authenticated
      // 4. We haven't already resolved this address
      if (isConnected && address && !user && hasAutoResolved.current !== address) {
        console.log('🔄 Auto-resolving wallet to Farcaster:', address)
        hasAutoResolved.current = address
        try {
          await signInWithWallet(address)
          setShowDialog(false)
        } catch (error) {
          console.error('Auto-resolve failed:', error)
        }
      }
    }
    autoResolve()
  }, [isConnected, address, user, signInWithWallet])

  // Find preferred connectors
  const preferred = useMemo(() => {
    const far = connectors.find((c) => /farcaster/i.test(c.name) || /mini.?app/i.test(c.name) || /warp/i.test(c.name))
    const inj = connectors.find((c) => /injected/i.test(c.id) || /metamask/i.test(c.id))
    const cbw = connectors.find((c) => /coinbase/i.test(c.id))
    return { far, inj, cbw }
  }, [connectors])

  const handleNeynarSignIn = async (): Promise<void> => {
    const clientId = process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID
    if (!clientId) {
      toast({
        title: 'Missing Neynar Client ID',
        description: 'Configure NEXT_PUBLIC_NEYNAR_CLIENT_ID to enable Farcaster login.',
        variant: 'destructive'
      })
      return
    }
    const authUrl = `https://app.neynar.com/login?client_id=${clientId}&redirect_uri=${encodeURIComponent(window.location.origin)}`
    setNeynarUrl(authUrl)
    window.open(authUrl, '_blank', 'width=500,height=700')
  }

  const handleWalletConnect = async (connector: any): Promise<void> => {
    try {
      // Connect wallet - the useEffect above will auto-resolve to Farcaster
      connect({ connector })
      // Dialog will close automatically when user is set via useEffect
    } catch (error) {
      console.error('Wallet connect failed:', error)
      toast({
        title: 'Connection Failed',
        description: 'Could not connect wallet',
        variant: 'destructive'
      })
    }
  }

  const handleSignOut = (): void => {
    // Reset auto-resolve tracker so user can re-login
    hasAutoResolved.current = null
    signOut()
    if (isConnected) {
      disconnect()
    }
    setShowDialog(false)
  }

  // If authenticated (Farcaster SDK or resolved from wallet)
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

          <Tabs defaultValue={isInFarcaster ? 'wallet' : 'neynar'} className="w-full">
            <TabsList className={`grid w-full ${!isInFarcaster ? 'grid-cols-2' : 'grid-cols-1'} bg-gray-800`}>
              {!isInFarcaster && (
                <TabsTrigger value="neynar" className="text-white">
                  🟣 Farcaster
                </TabsTrigger>
              )}
              <TabsTrigger value="wallet" className="text-white">
                💰 Wallet
              </TabsTrigger>
            </TabsList>

            {/* Neynar Tab - Only show outside Farcaster */}
            {!isInFarcaster && (
              <TabsContent value="neynar" className="space-y-4">
                <Card className="glass-card-dark border-purple-500/30">
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center">
                      <p className="text-lg font-bold mb-2">Sign in with Farcaster</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Scan QR code with Warpcast
                      </p>
                    </div>

                    {neynarUrl ? (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex justify-center p-4 bg-white rounded-xl"
                      >
                        <QRCodeSVG value={neynarUrl} size={200} level="H" includeMargin />
                      </motion.div>
                    ) : (
                      <Button
                        onClick={handleNeynarSignIn}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Generate QR Code
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            {/* Wallet Tab */}
            <TabsContent value="wallet" className="space-y-4">
              <Card className="glass-card-dark border-blue-500/30">
                <CardContent className="pt-6 space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-lg font-bold mb-2">Connect Wallet</p>
                    <p className="text-sm text-gray-400">
                      {isInFarcaster ? 'Use your connected wallet' : 'Connect with MetaMask or Coinbase'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {/* Farcaster connector (in mini app) */}
                    {preferred.far && (
                      <Button
                        onClick={() => handleWalletConnect(preferred.far)}
                        disabled={isPending}
                        variant="outline"
                        className="w-full border-purple-500/50 hover:bg-purple-500/20"
                      >
                        🟣 Farcaster Wallet
                      </Button>
                    )}

                    {/* Coinbase Wallet */}
                    {preferred.cbw && (
                      <Button
                        onClick={() => handleWalletConnect(preferred.cbw)}
                        disabled={isPending}
                        variant="outline"
                        className="w-full border-blue-500/50 hover:bg-blue-500/20"
                      >
                        🔵 Coinbase Wallet
                      </Button>
                    )}

                    {/* Injected (MetaMask) */}
                    {preferred.inj && (
                      <Button
                        onClick={() => handleWalletConnect(preferred.inj)}
                        disabled={isPending}
                        variant="outline"
                        className="w-full border-orange-500/50 hover:bg-orange-500/20"
                      >
                        🦊 MetaMask / Browser Wallet
                      </Button>
                    )}

                    {/* Fallback: show all connectors */}
                    {!preferred.far && !preferred.cbw && !preferred.inj && connectors.map((connector) => (
                      <Button
                        key={connector.id}
                        onClick={() => handleWalletConnect(connector)}
                        disabled={isPending}
                        variant="outline"
                        className="w-full border-gray-700 hover:bg-gray-800"
                      >
                        {connector.name}
                      </Button>
                    ))}
                  </div>

                  <div className="text-xs text-gray-500 text-center">
                    Your wallet will be linked to your Farcaster account if available
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  )
}
