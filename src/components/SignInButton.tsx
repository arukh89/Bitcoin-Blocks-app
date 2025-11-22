'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { QRCodeSVG } from 'qrcode.react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { base, arbitrum } from 'wagmi/chains'
import { motion } from 'framer-motion'

export function SignInButton(): JSX.Element {
  const { user, authMode, isInFarcaster, signInWithNeynar, signInWithWallet, signOut, walletChain, setWalletChain } = useAuth()
  const [showDialog, setShowDialog] = useState<boolean>(false)
  const [neynarUrl, setNeynarUrl] = useState<string>('')
  const [selectedChain, setSelectedChain] = useState<'base' | 'arbitrum'>(walletChain || 'base')
  
  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  // Auto sign in when wallet connects
  if (isConnected && address && !user) {
    signInWithWallet(address)
  }

  const handleNeynarSignIn = async (): Promise<void> => {
    try {
      // Generate Neynar auth URL
      const authUrl = `https://app.neynar.com/login?client_id=${process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID}&redirect_uri=${encodeURIComponent(window.location.origin)}`
      setNeynarUrl(authUrl)
      
      // Open in new window for OAuth flow
      window.open(authUrl, '_blank', 'width=500,height=700')
      
      await signInWithNeynar()
    } catch (error) {
      console.error('Neynar sign in failed:', error)
    }
  }

  const handleWalletConnect = (connectorId: string): void => {
    const connector = connectors.find((c) => c.id === connectorId)
    if (connector) {
      setWalletChain(selectedChain)
      connect({ connector, chainId: selectedChain === 'base' ? base.id : arbitrum.id })
      setShowDialog(false)
    }
  }

  const handleSignOut = (): void => {
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

          {user ? (
            // Authenticated - Show profile and sign out
            <Card className="glass-card-dark border-green-500/30">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={user.pfpUrl} 
                    alt={user.username}
                    className="w-16 h-16 rounded-full ring-2 ring-green-500"
                  />
                  <div>
                    <p className="font-bold text-lg">{user.displayName}</p>
                    <p className="text-sm text-gray-400">@{user.username}</p>
                    <Badge variant="outline" className="mt-1 bg-green-500/20 text-green-300 border-green-400/50">
                      {authMode === 'farcaster-sdk' && '🟣 Farcaster Mini App'}
                      {authMode === 'neynar' && '🔵 Neynar Web'}
                      {authMode === 'wallet' && `💰 ${walletChain?.toUpperCase()}`}
                    </Badge>
                  </div>
                </div>
                <Button
                  onClick={handleSignOut}
                  variant="destructive"
                  className="w-full"
                >
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          ) : (
            // Not authenticated - Show auth options
            <Tabs defaultValue="neynar" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                <TabsTrigger value="neynar" className="text-white">
                  🟣 Farcaster (Web)
                </TabsTrigger>
                <TabsTrigger value="wallet" className="text-white">
                  💰 Wallet
                </TabsTrigger>
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

                    {neynarUrl ? (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex justify-center p-4 bg-white rounded-xl"
                      >
                        <QRCodeSVG 
                          value={neynarUrl} 
                          size={200}
                          level="H"
                          includeMargin
                        />
                      </motion.div>
                    ) : (
                      <Button
                        onClick={handleNeynarSignIn}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Generate QR Code
                      </Button>
                    )}

                    <div className="text-xs text-gray-500 text-center">
                      Perfect for desktop browsers
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Wallet Tab */}
              <TabsContent value="wallet" className="space-y-4">
                <Card className="glass-card-dark border-blue-500/30">
                  <CardContent className="pt-6 space-y-4">
                    <div className="text-center mb-4">
                      <p className="text-lg font-bold mb-2">Connect Wallet</p>
                      <p className="text-sm text-gray-400">
                        Onchain authentication
                      </p>
                    </div>

                    {/* Chain Selector */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Select Network</label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => setSelectedChain('base')}
                          variant={selectedChain === 'base' ? 'default' : 'outline'}
                          className={selectedChain === 'base' ? 'bg-blue-600' : 'border-gray-700'}
                        >
                          🔵 Base
                        </Button>
                        <Button
                          onClick={() => setSelectedChain('arbitrum')}
                          variant={selectedChain === 'arbitrum' ? 'default' : 'outline'}
                          className={selectedChain === 'arbitrum' ? 'bg-blue-600' : 'border-gray-700'}
                        >
                          🔵 Arbitrum
                        </Button>
                      </div>
                    </div>

                    {/* Wallet Connectors */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Choose Wallet</label>
                      {connectors.map((connector) => (
                        <Button
                          key={connector.id}
                          onClick={() => handleWalletConnect(connector.id)}
                          variant="outline"
                          className="w-full border-gray-700 hover:bg-gray-800"
                        >
                          {connector.name}
                        </Button>
                      ))}
                    </div>

                    <div className="text-xs text-gray-500 text-center">
                      Supports Base & Arbitrum networks
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
