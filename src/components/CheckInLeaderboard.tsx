'use client'

import { useGame } from '@/context/GameContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Trophy, Flame, Star } from 'lucide-react'

export function CheckInLeaderboard() {
  const { weeklyCheckInLeaderboard } = useGame()

  if (!weeklyCheckInLeaderboard || weeklyCheckInLeaderboard.length === 0) {
    return null
  }

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Trophy className="w-5 h-5 text-yellow-500" />
          Weekly Check-In Leaders
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weeklyCheckInLeaderboard.map((entry, index) => {
            const rank = index + 1
            const isTopThree = rank <= 3

            return (
              <div
                key={`${entry.userIdentifier}-${entry.currentStreak}`}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  isTopThree ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-500/30' : 'bg-gray-800'
                }`}
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-8 text-center">
                  {rank === 1 && <span className="text-2xl">🥇</span>}
                  {rank === 2 && <span className="text-2xl">🥈</span>}
                  {rank === 3 && <span className="text-2xl">🥉</span>}
                  {rank > 3 && <span className="text-gray-400 font-bold">#{rank}</span>}
                </div>

                {/* Avatar */}
                <Avatar className="w-10 h-10">
                  <AvatarImage src={entry.pfpUrl} alt={entry.username} />
                  <AvatarFallback className="bg-purple-600 text-white">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{entry.username}</div>
                  <div className="text-xs text-gray-400">
                    {entry.weeklyCheckins} check-ins this week
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3">
                  {/* Streak */}
                  <Badge className="bg-orange-600 text-white flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {entry.currentStreak}
                  </Badge>

                  {/* Points */}
                  <Badge className="bg-purple-600 text-white flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {entry.totalPoints}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>

        {weeklyCheckInLeaderboard.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No check-ins yet this week.</p>
            <p className="text-sm">Be the first to check in!</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
