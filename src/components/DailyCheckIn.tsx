'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useGame } from '@/context/GameContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Flame, Trophy, Gift } from 'lucide-react'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { useToast } from '@/hooks/use-toast'

// Check-in contract address (receives 0 ETH tx as proof of check-in)
const CHECKIN_CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000' as `0x${string}`

export function DailyCheckIn() {
  const { user, walletAddress } = useAuth()
  const { checkIn, userStats, hasCheckedInToday } = useGame()
  const [showReward, setShowReward] = useState<boolean>(false)
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false)
  const { toast } = useToast()
  
  // Wagmi hooks for onchain transaction
  const { isConnected } = useAccount()
  const { sendTransaction, data: txHash, isPending: isSending } = useSendTransaction()
  const { isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  const handleCheckIn = async (): Promise<void> => {
    if (!user) return
    
    // If user logged in via wallet, require onchain transaction
    if (walletAddress && isConnected) {
      setIsCheckingIn(true)
      try {
        // Send 0 ETH transaction to burn address as proof of check-in
        // User pays gas fee on Base mainnet
        sendTransaction({
          to: CHECKIN_CONTRACT_ADDRESS,
          value: parseEther('0'),
          data: `0x${Buffer.from(`checkin:${user.address}:${Date.now()}`).toString('hex')}` as `0x${string}`,
        }, {
          onSuccess: async (hash) => {
            toast({
              title: 'Transaction Sent',
              description: 'Waiting for confirmation...',
            })
            // Wait a bit for confirmation then record check-in
            const res = await checkIn(user.address, user.username, user.pfpUrl)
            setIsCheckingIn(false)
            if (res.success) {
              setShowReward(true)
              setTimeout(() => setShowReward(false), 3000)
              toast({
                title: 'Check-in Successful!',
                description: `You earned ${res.pointsEarned} points. Tx: ${hash.slice(0, 10)}...`,
              })
            }
          },
          onError: (error) => {
            setIsCheckingIn(false)
            toast({
              title: 'Transaction Failed',
              description: error.message || 'Failed to send check-in transaction',
              variant: 'destructive',
            })
          },
        })
      } catch (error) {
        setIsCheckingIn(false)
        toast({
          title: 'Check-in Failed',
          description: 'Could not initiate transaction',
          variant: 'destructive',
        })
      }
    } else {
      // Farcaster-only users (no wallet connected) - just record in DB
      setIsCheckingIn(true)
      const res = await checkIn(user.address, user.username, user.pfpUrl)
      setIsCheckingIn(false)
      if (res.success) {
        setShowReward(true)
        setTimeout(() => setShowReward(false), 3000)
      }
    }
  }

  if (!user) {
    return null
  }

  const canCheckIn = !hasCheckedInToday
  const streak = userStats?.currentStreak || 0
  const totalPoints = userStats?.totalPoints || 0

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Calendar className="w-5 h-5" />
          Daily Check-In
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
            <div className="text-xl font-bold text-white">{streak}</div>
            <div className="text-xs text-gray-400">Day Streak</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
            <div className="text-xl font-bold text-white">{totalPoints}</div>
            <div className="text-xs text-gray-400">Total Points</div>
          </div>
          <div className="text-center p-3 bg-gray-800 rounded-lg">
            <Gift className="w-5 h-5 mx-auto mb-1 text-purple-500" />
            <div className="text-xl font-bold text-white">+{streak >= 7 ? 50 : 10}</div>
            <div className="text-xs text-gray-400">Next Reward</div>
          </div>
        </div>

        {/* Check-in Button */}
        <Button
          onClick={handleCheckIn}
          disabled={!canCheckIn || isCheckingIn || isSending || isConfirming}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6"
        >
          {isSending ? '⏳ Confirm in Wallet...' : 
           isConfirming ? '⏳ Confirming...' : 
           isCheckingIn ? 'Checking In...' : 
           canCheckIn ? (walletAddress && isConnected ? '🔗 Check In (Pay Gas)' : 'Check In Today') : 
           'Already Checked In'}
        </Button>

        {walletAddress && isConnected && canCheckIn && (
          <div className="text-center text-xs text-gray-400">
            💡 Check-in requires a small gas fee on Base network
          </div>
        )}

        {!canCheckIn && (
          <div className="text-center text-sm text-green-400">
            ✓ You&apos;ve checked in today! Come back tomorrow.
          </div>
        )}

        {/* Reward Animation */}
        {showReward && (
          <div className="text-center p-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/50 animate-pulse">
            <div className="text-2xl font-bold text-yellow-400">+10 Points!</div>
            <div className="text-sm text-gray-300">Keep your streak going! 🔥</div>
          </div>
        )}

        {/* Weekly Bonus Info */}
        {streak >= 6 && streak < 7 && (
          <Badge className="w-full justify-center bg-purple-600 text-white">
            🎉 Check in tomorrow for 50 bonus points!
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}
