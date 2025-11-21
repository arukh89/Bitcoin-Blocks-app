'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { Round, Guess, Log, User, ChatMessage, PrizeConfiguration } from '@/types/game'
import type { UserStats, CheckInRecord, WeeklyLeaderboardEntry, CheckInResult } from '@/types/checkin'
import { useAuth, ADMIN_FIDS, isAdminFid, isAdminWallet, ADMIN_WALLETS } from '@/context/AuthContext'

// Real-time client import
import { connectToSpacetime, type DbConnection } from '@/lib/spacetime-client'

import type { 
  Round as STDBRound, 
  Guess as STDBGuess, 
  LogEvent as STDBLog,
  ChatMessage as STDBChatMsg,
  PrizeConfig as STDBPrizeConfig 
} from '@/spacetime_module_bindings/index'

interface GameContextType {
  rounds: Round[]
  guesses: Guess[]
  logs: Log[]
  chatMessages: ChatMessage[]
  activeRound: Round | null
  prizeConfig: PrizeConfiguration | null
  createRound: (roundNumber: number, startTime: number, endTime: number, prize: string, blockNumber?: number, duration?: number) => Promise<void>
  submitGuess: (roundId: string, address: string, username: string, guess: number, pfpUrl: string) => Promise<boolean>
  endRound: (roundId: string) => Promise<boolean>
  updateRoundResult: (roundId: string, actualTxCount: number, blockHash: string, winningAddress: string) => Promise<void>
  getGuessesForRound: (roundId: string) => Guess[]
  hasUserGuessed: (roundId: string, address: string) => boolean
  addChatMessage: (message: ChatMessage) => void
  connected: boolean
  client: DbConnection | null
  // Check-in functions
  checkIn: (userIdentifier: string, username: string, pfpUrl: string) => Promise<CheckInResult>
  userStats: UserStats | null
  hasCheckedInToday: boolean
  weeklyCheckInLeaderboard: WeeklyLeaderboardEntry[]
}

const GameContext = createContext<GameContextType | undefined>(undefined)

export { ADMIN_FIDS, isAdminFid, ADMIN_WALLETS, isAdminWallet }

export function isDevAddress(addr: string): boolean {
  if (!addr) return false
  if (addr.startsWith('fid-')) {
    const fid = Number(addr.slice(4))
    return isAdminFid(fid)
  }
  // Wallet admin support
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return isAdminWallet(addr)
  }
  return false
}

// Convert SpacetimeDB bigint timestamps to JS milliseconds
function toMillis(bigintSeconds: bigint): number {
  return Number(bigintSeconds) * 1000
}

function convertRound(r: STDBRound): Round {
  return {
    id: String(r.roundId),
    roundNumber: Number(r.roundNumber),
    startTime: toMillis(r.startTime),
    endTime: toMillis(r.endTime),
    prize: r.prize,
    status: r.status as 'open' | 'closed' | 'finished',
    blockNumber: r.blockNumber ? Number(r.blockNumber) : undefined,
    actualTxCount: r.actualTxCount ? Number(r.actualTxCount) : undefined,
    winningAddress: r.winningFid ? `fid-${r.winningFid.toString()}` : undefined,
    blockHash: r.blockHash || undefined,
    createdAt: toMillis(r.createdAt),
    duration: Number(r.durationMinutes)
  }
}

function convertGuess(g: STDBGuess): Guess {
  return {
    id: String(g.guessId),
    roundId: String(g.roundId),
    address: `fid-${g.fid.toString()}`,
    username: g.username,
    guess: Number(g.guess),
    pfpUrl: g.pfpUrl || '',
    submittedAt: toMillis(g.submittedAt)
  }
}

function convertLog(l: STDBLog): Log {
  return {
    id: String(l.logId),
    eventType: l.eventType,
    details: l.details,
    timestamp: toMillis(l.timestamp)
  }
}

function convertChatMsg(c: STDBChatMsg): ChatMessage {
  return {
    id: String(c.chatId),
    roundId: c.roundId,
    address: c.address,
    username: c.username,
    message: c.message,
    pfpUrl: c.pfpUrl,
    timestamp: toMillis(c.timestamp),
    type: c.msgType as 'guess' | 'system' | 'winner' | 'chat'
  }
}

function convertPrizeConfig(p: STDBPrizeConfig): PrizeConfiguration {
  return {
    id: p.configId,
    jackpotAmount: String(p.jackpotAmount),
    firstPlaceAmount: String(p.firstPlaceAmount),
    secondPlaceAmount: String(p.secondPlaceAmount),
    currencyType: p.currencyType,
    updatedAt: toMillis(p.updatedAt)
  }
}

export function GameProvider({ children }: { children: ReactNode }): JSX.Element {
  const { user, userFid } = useAuth()
  const [rounds, setRounds] = useState<Round[]>([])
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfiguration | null>(null)
  const [client, setClient] = useState<DbConnection | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([])
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false)
  const [weeklyCheckInLeaderboard, setWeeklyCheckInLeaderboard] = useState<WeeklyLeaderboardEntry[]>([])

  const activeRound = rounds.find(r => r.status === 'open') || null

  // Authentication is now handled by AuthContext

  // ===========================================
  // DATABASE CONNECTION (REALTIME ONLY)
  // ===========================================
  useEffect(() => {
    let mounted = true

    const initConnection = async (): Promise<void> => {
      try {
        console.log('🟢 Initializing REALTIME mode...')
        setConnected(false)
        
        console.log('🔌 Connecting to SpacetimeDB...')
        const conn = await connectToSpacetime()
        
        if (mounted) {
          setClient(conn)
          console.log('✅ SpacetimeDB Client connected')
          setConnected(true)
          console.log('✅ REALTIME Connection established!')
          console.log('🟢 Database connection ready')
        }
      } catch (error) {
        console.error('❌ Failed to connect to SpacetimeDB:', error)
        setConnected(false)
      }
    }

    initConnection()

    return () => {
      mounted = false
    }
  }, [])

  // ===========================================
  // Subscribe to rounds table
  // ===========================================
  useEffect(() => {
    if (!client) return

    console.log('📊 [REALTIME] Subscribing to rounds table...')

    const unsubscribe = client.db.rounds.onInsert((ctx, row) => {
      const converted = convertRound(row)
      console.log('➕ [REALTIME] New round inserted:', converted)
      setRounds(prev => {
        const exists = prev.find(r => r.id === converted.id)
        if (exists) return prev
        return [...prev, converted]
      })
    })

    const unsubscribeUpdate = client.db.rounds.onUpdate((ctx, oldRow, newRow) => {
      const converted = convertRound(newRow)
      console.log('🔄 [REALTIME] Round updated:', converted)
      setRounds(prev => prev.map(r => r.id === converted.id ? converted : r))
    })

    // Load initial data
    const initialRounds = Array.from(client.db.rounds.iter()).map(convertRound)
    console.log('📥 [REALTIME] Initial rounds loaded:', initialRounds)
    setRounds(initialRounds)

    return () => {}
  }, [client])

  // ===========================================
  // Subscribe to check-in tables
  // ===========================================
  useEffect(() => {
    if (!client || !user) return
    if (!((client as any).db?.userStats) || !((client as any).db?.checkins)) return

    console.log('📊 [REALTIME] Subscribing to user_stats and checkins tables...')

    // Subscribe to user_stats
    const unsubscribeUserStats = (client.db as any).userStats.onInsert((ctx: any, row: any) => {
      if (row.userIdentifier === user.address) {
        setUserStats({
          userIdentifier: row.userIdentifier,
          username: row.username,
          pfpUrl: row.pfpUrl,
          totalPoints: Number(row.totalPoints),
          currentStreak: Number(row.currentStreak),
          longestStreak: Number(row.longestStreak),
          lastCheckinDate: Number(row.lastCheckinDate) * 1000,
          totalCheckins: Number(row.totalCheckins),
          createdAt: Number(row.createdAt) * 1000,
          updatedAt: Number(row.updatedAt) * 1000
        })
      }
    })

    const unsubscribeUserStatsUpdate = (client.db as any).userStats.onUpdate((ctx: any, oldRow: any, newRow: any) => {
      if (newRow.userIdentifier === user.address) {
        setUserStats({
          userIdentifier: newRow.userIdentifier,
          username: newRow.username,
          pfpUrl: newRow.pfpUrl,
          totalPoints: Number(newRow.totalPoints),
          currentStreak: Number(newRow.currentStreak),
          longestStreak: Number(newRow.longestStreak),
          lastCheckinDate: Number(newRow.lastCheckinDate) * 1000,
          totalCheckins: Number(newRow.totalCheckins),
          createdAt: Number(newRow.createdAt) * 1000,
          updatedAt: Number(newRow.updatedAt) * 1000
        })
      }
    })

    // Load initial user_stats
    for (const stat of (client.db as any).userStats.iter()) {
      if (stat.userIdentifier === user.address) {
        setUserStats({
          userIdentifier: stat.userIdentifier,
          username: stat.username,
          pfpUrl: stat.pfpUrl,
          totalPoints: Number(stat.totalPoints),
          currentStreak: Number(stat.currentStreak),
          longestStreak: Number(stat.longestStreak),
          lastCheckinDate: Number(stat.lastCheckinDate) * 1000,
          totalCheckins: Number(stat.totalCheckins),
          createdAt: Number(stat.createdAt) * 1000,
          updatedAt: Number(stat.updatedAt) * 1000
        })
        break
      }
    }

    // Subscribe to checkins
    const unsubscribeCheckins = (client.db as any).checkins.onInsert((ctx: any, row: any) => {
      if (row.userIdentifier === user.address) {
        setCheckInRecords(prev => [{
          checkinId: String(row.checkinId),
          userIdentifier: row.userIdentifier,
          username: row.username,
          pfpUrl: row.pfpUrl,
          checkinDate: Number(row.checkinDate) * 1000,
          pointsEarned: Number(row.pointsEarned),
          streakCount: Number(row.streakCount)
        }, ...prev])
      }
    })

    // Load initial checkins
    const userCheckins: CheckInRecord[] = []
    for (const checkin of (client.db as any).checkins.iter()) {
      if (checkin.userIdentifier === user.address) {
        userCheckins.push({
          checkinId: String(checkin.checkinId),
          userIdentifier: checkin.userIdentifier,
          username: checkin.username,
          pfpUrl: checkin.pfpUrl,
          checkinDate: Number(checkin.checkinDate) * 1000,
          pointsEarned: Number(checkin.pointsEarned),
          streakCount: Number(checkin.streakCount)
        })
      }
    }
    setCheckInRecords(userCheckins)

    return () => {}
  }, [client, user])

  // Check if user has checked in today
  useEffect(() => {
    if (!checkInRecords.length) {
      setHasCheckedInToday(false)
      return
    }

    const now = Date.now()
    const todayStart = now - (now % 86400000)

    const todayCheckin = checkInRecords.find(record => {
      const recordDayStart = record.checkinDate - (record.checkinDate % 86400000)
      return recordDayStart === todayStart
    })

    setHasCheckedInToday(!!todayCheckin)
  }, [checkInRecords])

  // Calculate weekly leaderboard (recomputes when client or check-in records change)
  useEffect(() => {
    if (!client || !((client as any).db?.checkins) || !((client as any).db?.userStats)) {
      setWeeklyCheckInLeaderboard([])
      return
    }

    const now = Date.now() / 1000
    const weekAgo = now - (7 * 86400)
    const userMap = new Map<string, WeeklyLeaderboardEntry>()

    // Count check-ins in last 7 days
    for (const checkin of (client.db as any).checkins.iter()) {
      if (Number(checkin.checkinDate) >= weekAgo) {
        const existing = userMap.get(checkin.userIdentifier)
        if (existing) {
          existing.weeklyCheckins += 1
        } else {
          userMap.set(checkin.userIdentifier, {
            userIdentifier: checkin.userIdentifier,
            username: checkin.username,
            pfpUrl: checkin.pfpUrl,
            weeklyCheckins: 1,
            currentStreak: 0,
            totalPoints: 0
          })
        }
      }
    }

    // Add user stats data
    for (const stat of (client.db as any).userStats.iter()) {
      const entry = userMap.get(stat.userIdentifier)
      if (entry) {
        entry.currentStreak = Number(stat.currentStreak)
        entry.totalPoints = Number(stat.totalPoints)
      }
    }

    const leaderboard = Array.from(userMap.values())
      .sort((a, b) => {
        if (b.weeklyCheckins !== a.weeklyCheckins) {
          return b.weeklyCheckins - a.weeklyCheckins
        }
        return b.totalPoints - a.totalPoints
      })
      .slice(0, 10)

    setWeeklyCheckInLeaderboard(leaderboard)
  }, [client, checkInRecords])

  // ===========================================
  // Subscribe to guesses table
  // ===========================================
  useEffect(() => {
    if (!client) return

    console.log('📊 [REALTIME] Subscribing to guesses table...')

    const unsubscribe = client.db.guesses.onInsert((ctx, row) => {
      const converted = convertGuess(row)
      console.log('➕ [REALTIME] New guess inserted:', converted)
      setGuesses(prev => {
        const exists = prev.find(g => g.id === converted.id)
        if (exists) return prev
        return [...prev, converted]
      })
    })

    // Load initial data
    const initialGuesses = Array.from(client.db.guesses.iter()).map(convertGuess)
    console.log('📥 [REALTIME] Initial guesses loaded:', initialGuesses.length, 'guesses')
    setGuesses(initialGuesses)

    return () => {}
  }, [client])

  // ===========================================
  // Subscribe to logs table
  // ===========================================
  useEffect(() => {
    if (!client) return

    const unsubscribe = client.db.logs.onInsert((ctx, row) => {
      const converted = convertLog(row)
      setLogs(prev => {
        const exists = prev.find(l => l.id === converted.id)
        if (exists) return prev
        return [...prev, converted]
      })
    })

    // Load initial data
    const initialLogs = Array.from(client.db.logs.iter()).map(convertLog)
    setLogs(initialLogs)

    return () => {}
  }, [client])

  // ===========================================
  // Subscribe to chat messages table
  // ===========================================
  useEffect(() => {
    if (!client) return

    console.log('📊 [REALTIME] Subscribing to chat messages table...')

    const unsubscribe = client.db.chatMessages.onInsert((ctx, row) => {
      const converted = convertChatMsg(row)
      console.log('➕ [REALTIME] New chat message:', converted)
      setChatMessages(prev => {
        const exists = prev.find(c => c.id === converted.id)
        if (exists) return prev
        return [converted, ...prev].slice(0, 100)
      })
    })

    // Load initial data
    const initialChat = Array.from(client.db.chatMessages.iter()).map(convertChatMsg)
    console.log('📥 [REALTIME] Initial chat messages loaded:', initialChat.length, 'messages')
    setChatMessages(initialChat.sort((a, b) => b.timestamp - a.timestamp).slice(0, 100))

    return () => {}
  }, [client])

  // ===========================================
  // Subscribe to prize config table
  // ===========================================
  useEffect(() => {
    if (!client) return

    console.log('📊 [REALTIME] Subscribing to prize config table...')

    const unsubscribe = client.db.prizeConfig.onInsert((ctx, row) => {
      const converted = convertPrizeConfig(row)
      console.log('➕ [REALTIME] New prize config:', converted)
      setPrizeConfig(converted)
    })

    const unsubscribeUpdate = client.db.prizeConfig.onUpdate((ctx, oldRow, newRow) => {
      const converted = convertPrizeConfig(newRow)
      console.log('🔄 [REALTIME] Prize config updated:', converted)
      setPrizeConfig(converted)
    })

    // Load initial data
    const initialConfigs = Array.from(client.db.prizeConfig.iter()).map(convertPrizeConfig)
    if (initialConfigs.length > 0) {
      console.log('📥 [REALTIME] Initial prize config loaded:', initialConfigs[0])
      setPrizeConfig(initialConfigs[0])
    }

    return () => {}
  }, [client])

  // ===========================================
  // REDUCERS / ACTIONS
  // ===========================================

  const createRound = useCallback(async (roundNumber: number, startTime: number, endTime: number, prize: string, blockNumber?: number, duration?: number): Promise<void> => {
    console.log('🎮 [REALTIME] createRound called', { roundNumber, startTime, endTime, prize, blockNumber, duration, connected, hasClient: !!client })
    
    if (!client || !connected) {
      const error = 'Not connected to database'
      console.error('❌', error)
      throw new Error(error)
    }
    
    try {
      const roundNumBigInt = BigInt(roundNumber)
      const durationMinutes = BigInt(duration || 10)
      const blockNumBigInt = blockNumber !== undefined ? BigInt(blockNumber) : undefined
      
      console.log('📤 [REALTIME] Creating round...', { roundNumber, durationMinutes: durationMinutes.toString(), prize, blockNumber })
      client.reducers.createRound(roundNumBigInt, durationMinutes, prize, blockNumBigInt)
      console.log('✅ [REALTIME] Round created successfully!')
    } catch (error) {
      console.error('❌ [REALTIME] Failed to create round:', error)
      throw error
    }
  }, [client, connected])

  const submitGuess = useCallback(async (
    roundId: string, 
    address: string, 
    username: string, 
    guess: number, 
    pfpUrl: string
  ): Promise<boolean> => {
    if (!client || !connected) {
      console.warn('⚠️ [REALTIME] Not connected')
      return false
    }

    const round = rounds.find(r => r.id === roundId)
    if (!round || round.status !== 'open') {
      console.warn('⚠️ [REALTIME] Round not open:', { roundId, status: round?.status })
      return false
    }

    const now = Date.now()
    if (now >= round.endTime) {
      console.warn('⚠️ [REALTIME] Round time expired')
      return false
    }

    const hasGuessed = guesses.some(g => g.roundId === roundId && g.address.toLowerCase() === address.toLowerCase())
    if (hasGuessed) {
      console.warn('⚠️ [REALTIME] User already guessed')
      return false
    }

    try {
      // Require FID-based address ("fid-<number>") for submissions
      if (!address.startsWith('fid-')) {
        console.warn('⚠️ [REALTIME] Guess requires Farcaster login (FID-only)')
        return false
      }
      const fidNum = Number(address.slice(4))
      if (!Number.isFinite(fidNum) || fidNum <= 0) {
        console.warn('⚠️ [REALTIME] Invalid FID in address:', address)
        return false
      }

      client.reducers.submitGuess(
        BigInt(roundId),
        BigInt(fidNum),
        username,
        BigInt(guess),
        pfpUrl || undefined
      )

      console.log('✅ [REALTIME] Guess submitted!')
      return true
    } catch (error) {
      console.error('❌ [REALTIME] Failed to submit guess:', error)
      return false
    }
  }, [client, connected, rounds, guesses])

  const endRound = useCallback(async (roundId: string): Promise<boolean> => {
    if (!client || !connected) {
      console.warn('⚠️ [REALTIME] Not connected')
      return false
    }

    const round = rounds.find(r => r.id === roundId)
    if (!round || round.status !== 'open') {
      console.warn('⚠️ [REALTIME] Round not open:', { roundId, status: round?.status })
      return false
    }

    try {
      client.reducers.endRoundManually(BigInt(roundId))
      console.log('✅ [REALTIME] Round ended!')
      return true
    } catch (error) {
      console.error('❌ [REALTIME] Failed to end round:', error)
      return false
    }
  }, [client, connected, rounds])

  const updateRoundResult = useCallback(async (
    roundId: string, 
    actualTxCount: number, 
    blockHash: string, 
    winningAddress: string
  ): Promise<void> => {
    if (!client || !connected) {
      throw new Error('Not connected to database')
    }
    
    // Expect fid-based winner address
    if (!winningAddress.startsWith('fid-')) {
      throw new Error('Winner address must be FID-based (fid-<number>)')
    }
    const fidNum = Number(winningAddress.slice(4))
    if (!Number.isFinite(fidNum) || fidNum <= 0) {
      throw new Error('Invalid winner FID')
    }

    client.reducers.updateRoundResult(
      BigInt(roundId),
      BigInt(actualTxCount),
      blockHash,
      BigInt(fidNum)
    )
    
    console.log('✅ [REALTIME] Round result updated!')
  }, [client, connected])

  const getGuessesForRound = useCallback((roundId: string): Guess[] => {
    return guesses.filter(g => g.roundId === roundId)
  }, [guesses])

  const hasUserGuessed = useCallback((roundId: string, address: string): boolean => {
    return guesses.some(g => g.roundId === roundId && g.address.toLowerCase() === address.toLowerCase())
  }, [guesses])

  const addChatMessage = useCallback(async (message: ChatMessage): Promise<void> => {
    console.log('💬 [REALTIME] addChatMessage called', { message, connected, hasClient: !!client })
    
    if (!client || !connected) {
      const warning = 'Not connected to database'
      console.warn('⚠️ [REALTIME]', warning)
      throw new Error(warning)
    }
    
    try {
      console.log('📤 [REALTIME] Sending chat message...')
      
      client.reducers.sendChatMessage(
        message.roundId,
        message.address,
        message.username,
        message.message,
        message.pfpUrl || '',
        message.type
      )
      console.log('✅ [REALTIME] Chat message sent!')
    } catch (error) {
      console.error('❌ [REALTIME] Failed to send chat message:', error)
      throw error
    }
  }, [client, connected])

  // Auto-close rounds when end time is reached
  useEffect(() => {
    if (!activeRound || !client || !connected) return

    const checkRoundEnd = (): void => {
      const now = Date.now()
      if (activeRound.status === 'open' && now >= activeRound.endTime) {
        endRound(activeRound.id).catch(console.error)
      }
    }

    const interval = setInterval(checkRoundEnd, 1000)
    return () => clearInterval(interval)
  }, [activeRound, client, connected, endRound])

  // Check-in function
  const checkIn = useCallback(async (
    userIdentifier: string,
    username: string,
    pfpUrl: string
  ): Promise<CheckInResult> => {
    if (!client || !connected) {
      return { success: false, error: 'Not connected to database' }
    }

    try {
      console.log('📝 [REALTIME] Performing check-in...', { userIdentifier, username })
      
      if (!('dailyCheckin' in (client.reducers as any))) {
        return { success: false, error: 'Check-in not available on this deployment' }
      }
      ;(client.reducers as any).dailyCheckin(userIdentifier, username, pfpUrl)
      
      console.log('✅ [REALTIME] Check-in successful!')
      
      // Return success - actual data will come through subscriptions
      return {
        success: true,
        pointsEarned: userStats ? (10 + ((userStats.currentStreak + 1) * 2)) : 12,
        newStreak: userStats ? userStats.currentStreak + 1 : 1
      }
    } catch (error) {
      console.error('❌ [REALTIME] Check-in failed:', error)
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: errorMsg }
    }
  }, [client, connected, userStats])

  const value: GameContextType = {
    rounds,
    guesses,
    logs,
    chatMessages,
    activeRound,
    prizeConfig,
    createRound,
    submitGuess,
    endRound,
    updateRoundResult,
    getGuessesForRound,
    hasUserGuessed,
    addChatMessage,
    connected,
    client,
    checkIn,
    userStats,
    hasCheckedInToday,
    weeklyCheckInLeaderboard
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): GameContextType {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
