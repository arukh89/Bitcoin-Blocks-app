'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useGame } from '@/context/GameContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Flame, Trophy, Gift } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { sendTransaction } from '@/lib/ethereum-provider'

// Burn address for check-in proof
const CHECKIN_ADDRESS = '0x0000000000000000000000000000000000000000'

export function DailyCheckIn() {
  const { user, walletAddress, isInFarcaster } = useAuth()
  const { checkIn, userStats, hasCheckedInToday } = useGame()
  const [showReward, setShowReward] = useState(false)
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const { toast } = useToast()

  const handleCheckIn = async (): Promise<void> => {
    if (!user || isCheckingIn) return
    
    setIsCheckingIn(true)
    
    try {
      // If user has wallet, require onchain transaction as proof
      if (walletAddress) {
        toast({ title: 'Confirm in wallet', description: 'Approve the check-in transaction' })
        
        // Sanitize user address - only allow alphanumeric and hyphens
        const sanitizedAddress = user.address.replace(/[^a-zA-Z0-9-]/g, '')
        const timestamp = Date.now()
        
        // Create check-in data with sanitized input
        const checkinPayload = `checkin:${sanitizedAddress}:${timestamp}`
        const data = `0x${Buffer.from(checkinPayload).toString('hex')}`
        
        const txHash = await sendTransaction({
          to: CHECKIN_ADDRESS,
          data,
          value: '0x0'
        })
        
        toast({ title: 'Transaction sent', description: `Tx: ${txHash.slice(0, 10)}...` })
      }
      
      // Record check-in in database
      const res = await checkIn(user.address, user.username, user.pfpUrl)
      
      if (res.success) {
        setShowReward(true)
        setTimeout(() => setShowReward(false), 3000)
        toast({
          title: 'Check-in Successful!',
          description: `You earned ${res.pointsEarned} points!`
        })
      } else {
        toast({
          title: 'Check-in Failed',
          description: res.error || 'Could not complete check-in',
          variant: 'destructive'
        })
      }
    } catch (error: any) {
      console.error('Check-in error:', error)
      if (!error?.message?.includes('rejected') && !error?.message?.includes('denied')) {
        toast({
          title: 'Check-in Failed',
          description: error?.message || 'Could not complete check-in',
          variant: 'destructive'
        })
      }
    } finally {
      setIsCheckingIn(false)
    }
  }

  if (!user) return null

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
          disabled={!canCheckIn || isCheckingIn}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6"
        >
          {isCheckingIn ? '⏳ Processing...' : 
           canCheckIn ? (walletAddress ? '🔗 Check In (Pay Gas)' : '✅ Check In Today') : 
           '✓ Already Checked In'}
        </Button>

        {walletAddress && canCheckIn && (
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
            <div className="text-2xl font-bold text-yellow-400">+{streak >= 7 ? 50 : 10} Points!</div>
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
