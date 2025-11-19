'use client'

import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useGame } from '@/context/GameContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Flame, Trophy, Gift } from 'lucide-react'

export function DailyCheckIn() {
  const { user } = useAuth()
  const { checkIn, userStats, hasCheckedInToday } = useGame()
  const [showReward, setShowReward] = useState<boolean>(false)
  const [isCheckingIn, setIsCheckingIn] = useState<boolean>(false)

  const handleCheckIn = async (): Promise<void> => {
    if (!user) return
    
    setIsCheckingIn(true)
    const res = await checkIn(user.address, user.username, user.pfpUrl)
    setIsCheckingIn(false)
    if (res.success) {
      setShowReward(true)
      setTimeout(() => setShowReward(false), 3000)
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
          disabled={!canCheckIn || isCheckingIn}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-6"
        >
          {isCheckingIn ? 'Checking In...' : canCheckIn ? 'Check In Today' : 'Already Checked In'}
        </Button>

        {!canCheckIn && (
          <div className="text-center text-sm text-green-400">
            ✓ You’ve checked in today! Come back tomorrow.
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
