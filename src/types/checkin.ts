// Check-In Type Definitions

export interface UserStats {
  userIdentifier: string
  username: string
  pfpUrl: string
  totalPoints: number
  currentStreak: number
  longestStreak: number
  lastCheckinDate: number
  totalCheckins: number
  createdAt: number
  updatedAt: number
}

export interface CheckInRecord {
  checkinId: string
  userIdentifier: string
  username: string
  pfpUrl: string
  checkinDate: number
  pointsEarned: number
  streakCount: number
}

export interface WeeklyLeaderboardEntry {
  userIdentifier: string
  username: string
  pfpUrl: string
  weeklyCheckins: number
  currentStreak: number
  totalPoints: number
}

export interface CheckInResult {
  success: boolean
  pointsEarned?: number
  newStreak?: number
  error?: string
}
