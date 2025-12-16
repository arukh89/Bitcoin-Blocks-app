'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { Round, Guess, Log, ChatMessage, PrizeConfiguration } from '@/types/game'
import type { UserStats, CheckInRecord, WeeklyLeaderboardEntry, CheckInResult } from '@/types/checkin'
import { useAuth, ADMIN_FIDS, isAdminFid, isAdminWallet, ADMIN_WALLETS } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase-client'
import type { RealtimeChannel } from '@supabase/supabase-js'

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
  client: typeof supabase | null
  settings: Record<string, string>
  getSetting: (k: string, def?: string) => string | undefined
  getInt: (k: string, def: number) => number
  getBool: (k: string, def: boolean) => boolean
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
  if (/^0x[a-fA-F0-9]{40}$/.test(addr)) {
    return isAdminWallet(addr)
  }
  return false
}

function convertDbRound(r: any): Round {
  return {
    id: String(r.id),
    roundNumber: r.round_number,
    startTime: new Date(r.start_time).getTime(),
    endTime: new Date(r.end_time).getTime(),
    prize: r.prize || '',
    status: r.status as 'open' | 'closed' | 'finished',
    blockNumber: r.block_number || undefined,
    actualTxCount: r.actual_tx_count || undefined,
    winningAddress: r.winning_fid ? `fid-${r.winning_fid}` : undefined,
    blockHash: r.block_hash || undefined,
    createdAt: new Date(r.created_at).getTime(),
    duration: r.duration_minutes
  }
}

function convertDbGuess(g: any): Guess {
  return {
    id: String(g.id),
    roundId: String(g.round_id),
    address: `fid-${g.fid}`,
    username: g.username,
    guess: g.guess,
    pfpUrl: g.pfp_url || '',
    submittedAt: new Date(g.submitted_at).getTime()
  }
}

function convertDbChat(c: any): ChatMessage {
  return {
    id: String(c.id),
    roundId: c.round_id,
    address: c.address,
    username: c.username,
    message: c.message,
    pfpUrl: c.pfp_url || '',
    timestamp: new Date(c.created_at).getTime(),
    type: c.msg_type as 'guess' | 'system' | 'winner' | 'chat'
  }
}

function convertDbPrizeConfig(p: any): PrizeConfiguration {
  return {
    id: p.id,
    jackpotAmount: String(p.jackpot_amount),
    firstPlaceAmount: String(p.first_place_amount),
    secondPlaceAmount: String(p.second_place_amount),
    currencyType: p.currency_type,
    updatedAt: new Date(p.updated_at).getTime()
  }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [rounds, setRounds] = useState<Round[]>([])
  const [guesses, setGuesses] = useState<Guess[]>([])
  const [logs, setLogs] = useState<Log[]>([])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfiguration | null>(null)
  const [connected, setConnected] = useState<boolean>(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([])
  const [hasCheckedInToday, setHasCheckedInToday] = useState<boolean>(false)
  const [weeklyCheckInLeaderboard, setWeeklyCheckInLeaderboard] = useState<WeeklyLeaderboardEntry[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})

  const channelRef = useRef<RealtimeChannel | null>(null)
  const activeRound = rounds.find(r => r.status === 'open') || null

  // Initialize connection and load data
  useEffect(() => {
    let mounted = true

    async function init() {
      try {
        // Load initial data
        const [roundsRes, guessesRes, chatRes, prizeRes, settingsRes] = await Promise.all([
          supabase.from('rounds').select('*').order('created_at', { ascending: false }),
          supabase.from('guesses').select('*').order('submitted_at', { ascending: false }),
          supabase.from('chat_messages').select('*').order('created_at', { ascending: false }).limit(100),
          supabase.from('prize_config').select('*').single(),
          supabase.from('settings').select('*')
        ])

        if (!mounted) return

        if (roundsRes.data) setRounds(roundsRes.data.map(convertDbRound))
        if (guessesRes.data) setGuesses(guessesRes.data.map(convertDbGuess))
        if (chatRes.data) setChatMessages(chatRes.data.map(convertDbChat))
        if (prizeRes.data) setPrizeConfig(convertDbPrizeConfig(prizeRes.data))
        if (settingsRes.data) {
          const s: Record<string, string> = {}
          settingsRes.data.forEach((row: any) => { s[row.key] = row.value })
          setSettings(s)
        }

        setConnected(true)
        console.log('✅ Connected to Supabase')

        // Setup realtime subscriptions
        const channel = supabase.channel('game-updates')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, (payload) => {
            if (payload.eventType === 'INSERT') {
              setRounds(prev => [convertDbRound(payload.new), ...prev])
            } else if (payload.eventType === 'UPDATE') {
              setRounds(prev => prev.map(r => r.id === String(payload.new.id) ? convertDbRound(payload.new) : r))
            }
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'guesses' }, (payload) => {
            setGuesses(prev => [convertDbGuess(payload.new), ...prev])
          })
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
            setChatMessages(prev => [convertDbChat(payload.new), ...prev].slice(0, 100))
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'prize_config' }, (payload) => {
            if (payload.new) setPrizeConfig(convertDbPrizeConfig(payload.new))
          })
          .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stats' }, (payload) => {
            if (payload.new && user && payload.new.user_identifier === user.address) {
              setUserStats({
                userIdentifier: payload.new.user_identifier,
                username: payload.new.username,
                pfpUrl: payload.new.pfp_url,
                totalPoints: payload.new.total_points,
                currentStreak: payload.new.current_streak,
                longestStreak: payload.new.longest_streak,
                lastCheckinDate: new Date(payload.new.last_checkin_date).getTime(),
                totalCheckins: payload.new.total_checkins,
                createdAt: new Date(payload.new.created_at).getTime(),
                updatedAt: new Date(payload.new.updated_at).getTime()
              })
            }
          })
          .subscribe()

        channelRef.current = channel
      } catch (error) {
        console.error('❌ Failed to connect to Supabase:', error)
        setConnected(false)
      }
    }

    init()

    return () => {
      mounted = false
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
      }
    }
  }, [user])

  // Load user stats when user changes
  useEffect(() => {
    if (!user) return

    async function loadUserStats() {
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_identifier', user.address)
        .single()

      if (data) {
        setUserStats({
          userIdentifier: data.user_identifier,
          username: data.username,
          pfpUrl: data.pfp_url,
          totalPoints: data.total_points,
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastCheckinDate: data.last_checkin_date ? new Date(data.last_checkin_date).getTime() : 0,
          totalCheckins: data.total_checkins,
          createdAt: new Date(data.created_at).getTime(),
          updatedAt: new Date(data.updated_at).getTime()
        })
      }

      // Load checkin records
      const { data: checkins } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_identifier', user.address)
        .order('checkin_date', { ascending: false })

      if (checkins) {
        setCheckInRecords(checkins.map((c: any) => ({
          checkinId: String(c.id),
          userIdentifier: c.user_identifier,
          username: c.username,
          pfpUrl: c.pfp_url,
          checkinDate: new Date(c.checkin_date).getTime(),
          pointsEarned: c.points_earned,
          streakCount: c.streak_count
        })))
      }
    }

    loadUserStats()
  }, [user])

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

  // Calculate weekly leaderboard
  useEffect(() => {
    async function loadLeaderboard() {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString()
      
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .order('total_points', { ascending: false })
        .limit(10)

      if (stats) {
        setWeeklyCheckInLeaderboard(stats.map((s: any) => ({
          userIdentifier: s.user_identifier,
          username: s.username,
          pfpUrl: s.pfp_url,
          weeklyCheckins: s.total_checkins,
          currentStreak: s.current_streak,
          totalPoints: s.total_points
        })))
      }
    }
    loadLeaderboard()
  }, [checkInRecords])

  const getSetting = useCallback((k: string, def?: string) => settings[k] ?? def, [settings])
  const getInt = useCallback((k: string, def: number) => {
    const s = settings[k]
    const n = s ? parseInt(s, 10) : NaN
    return Number.isFinite(n) ? n : def
  }, [settings])
  const getBool = useCallback((k: string, def: boolean) => {
    const s = (settings[k] || '').toLowerCase()
    if (s === 'true' || s === '1') return true
    if (s === 'false' || s === '0') return false
    return def
  }, [settings])


  // Create a new round
  const createRound = useCallback(async (
    roundNumber: number,
    startTime: number,
    endTime: number,
    prize: string,
    blockNumber?: number,
    duration?: number
  ): Promise<void> => {
    if (!connected) throw new Error('Not connected to database')

    const { error } = await supabase.from('rounds').insert({
      round_number: roundNumber,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      duration_minutes: duration || 10,
      prize,
      block_number: blockNumber,
      status: 'open'
    })

    if (error) throw error
    console.log('✅ Round created successfully!')
  }, [connected])

  // Submit a guess
  const submitGuess = useCallback(async (
    roundId: string,
    address: string,
    username: string,
    guess: number,
    pfpUrl: string
  ): Promise<boolean> => {
    if (!connected) return false

    const round = rounds.find(r => r.id === roundId)
    if (!round || round.status !== 'open') return false
    if (Date.now() >= round.endTime) return false

    // Check if already guessed
    const hasGuessed = guesses.some(g => g.roundId === roundId && g.address.toLowerCase() === address.toLowerCase())
    if (hasGuessed) return false

    // Require FID
    if (!address.startsWith('fid-')) return false
    const fid = Number(address.slice(4))
    if (!Number.isFinite(fid) || fid <= 0) return false

    const { error } = await supabase.from('guesses').insert({
      round_id: Number(roundId),
      fid,
      username,
      guess,
      pfp_url: pfpUrl || null
    })

    if (error) {
      console.error('Failed to submit guess:', error)
      return false
    }

    console.log('✅ Guess submitted!')
    return true
  }, [connected, rounds, guesses])

  // End a round
  const endRound = useCallback(async (roundId: string): Promise<boolean> => {
    if (!connected) return false

    const { error } = await supabase
      .from('rounds')
      .update({ status: 'closed' })
      .eq('id', Number(roundId))

    if (error) {
      console.error('Failed to end round:', error)
      return false
    }

    console.log('✅ Round ended!')
    return true
  }, [connected])

  // Update round result
  const updateRoundResult = useCallback(async (
    roundId: string,
    actualTxCount: number,
    blockHash: string,
    winningAddress: string
  ): Promise<void> => {
    if (!connected) throw new Error('Not connected to database')

    if (!winningAddress.startsWith('fid-')) {
      throw new Error('Winner address must be FID-based')
    }
    const winningFid = Number(winningAddress.slice(4))

    const { error } = await supabase
      .from('rounds')
      .update({
        status: 'finished',
        actual_tx_count: actualTxCount,
        block_hash: blockHash,
        winning_fid: winningFid
      })
      .eq('id', Number(roundId))

    if (error) throw error
    console.log('✅ Round result updated!')
  }, [connected])

  const getGuessesForRound = useCallback((roundId: string): Guess[] => {
    return guesses.filter(g => g.roundId === roundId)
  }, [guesses])

  const hasUserGuessed = useCallback((roundId: string, address: string): boolean => {
    return guesses.some(g => g.roundId === roundId && g.address.toLowerCase() === address.toLowerCase())
  }, [guesses])

  // Add chat message
  const addChatMessage = useCallback(async (message: ChatMessage): Promise<void> => {
    if (!connected) throw new Error('Not connected to database')

    const { error } = await supabase.from('chat_messages').insert({
      round_id: message.roundId,
      address: message.address,
      username: message.username,
      message: message.message,
      pfp_url: message.pfpUrl || null,
      msg_type: message.type
    })

    if (error) throw error
    console.log('✅ Chat message sent!')
  }, [connected])

  // Daily check-in
  const checkIn = useCallback(async (
    userIdentifier: string,
    username: string,
    pfpUrl: string
  ): Promise<CheckInResult> => {
    if (!connected) return { success: false, error: 'Not connected to database' }

    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      // Check if already checked in today
      const { data: existingCheckin } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_identifier', userIdentifier)
        .gte('checkin_date', todayStart.toISOString())
        .single()

      if (existingCheckin) {
        return { success: false, error: 'Already checked in today' }
      }

      // Get or create user stats
      let { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_identifier', userIdentifier)
        .single()

      const basePoints = getInt('checkin_base_points', 10)
      const bonusPerDay = getInt('checkin_streak_bonus', 2)

      let newStreak = 1
      let totalPoints = basePoints + bonusPerDay

      if (stats) {
        const lastCheckin = stats.last_checkin_date ? new Date(stats.last_checkin_date) : null
        const yesterday = new Date(todayStart.getTime() - 86400000)

        if (lastCheckin && lastCheckin >= yesterday && lastCheckin < todayStart) {
          newStreak = stats.current_streak + 1
        }

        totalPoints = basePoints + (newStreak * bonusPerDay)

        await supabase
          .from('user_stats')
          .update({
            username,
            pfp_url: pfpUrl,
            current_streak: newStreak,
            longest_streak: Math.max(stats.longest_streak, newStreak),
            total_points: stats.total_points + totalPoints,
            total_checkins: stats.total_checkins + 1,
            last_checkin_date: now.toISOString(),
            updated_at: now.toISOString()
          })
          .eq('user_identifier', userIdentifier)
      } else {
        await supabase.from('user_stats').insert({
          user_identifier: userIdentifier,
          username,
          pfp_url: pfpUrl,
          current_streak: 1,
          longest_streak: 1,
          total_points: totalPoints,
          total_checkins: 1,
          last_checkin_date: now.toISOString()
        })
      }

      // Record the checkin
      await supabase.from('checkins').insert({
        user_identifier: userIdentifier,
        username,
        pfp_url: pfpUrl,
        points_earned: totalPoints,
        streak_count: newStreak
      })

      console.log('✅ Check-in successful!')
      return { success: true, pointsEarned: totalPoints, newStreak }
    } catch (error) {
      console.error('Check-in failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }, [connected, getInt])

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
    client: supabase,
    settings,
    getSetting,
    getInt,
    getBool,
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
