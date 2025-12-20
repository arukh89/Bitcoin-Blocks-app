'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { APP_CONFIG, isAdminFid, isRealtimeMode } from '@/config/app-config';
import type { Round, Guess, ChatMessage, PrizeConfig } from '@/types';

// ============================================
// TYPES
// ============================================

export interface GameUser {
  fid: number;
  username: string;
  displayName?: string;
  pfpUrl?: string;
  isAdmin: boolean;
}

interface GameState {
  // Connection
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;

  // User
  user: GameUser | null;

  // Game Data
  activeRound: Round | null;
  guesses: Guess[];
  chatMessages: ChatMessage[];
  prizeConfig: PrizeConfig | null;
  allRounds: Round[];
}

interface GameActions {
  // User
  setUser: (user: GameUser | null) => void;

  // Round Actions (Admin)
  createRound: (roundNumber: number, durationMinutes: number, prize: string, blockNumber?: number) => Promise<{ error: any }>;
  closeRound: (roundId: string) => Promise<{ error: any }>;
  updateRoundResult: (roundId: string, actualTxCount: number, blockHash: string) => Promise<{ error: any }>;

  // User Actions
  submitGuess: (guess: number) => Promise<{ error: any }>;
  sendChatMessage: (message: string, type?: 'chat' | 'guess' | 'system' | 'winner') => Promise<{ error: any }>;

  // Prize Config (Admin)
  updatePrizeConfig: (config: Partial<PrizeConfig>) => Promise<{ error: any }>;

  // Refresh
  refreshData: () => Promise<void>;
}

type GameContextType = GameState & GameActions;

// ============================================
// CONTEXT
// ============================================

const GameContext = createContext<GameContextType | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

// ============================================
// MOCK DATA (for testing without backend)
// ============================================

const MOCK_PRIZE_CONFIG: PrizeConfig = {
  id: 'mock-prize',
  jackpot: 5000,
  first_place: 1000,
  second_place: 500,
  currency: '$SECOND',
  token_address: null,
  updated_at: new Date().toISOString(),
};

// ============================================
// PROVIDER
// ============================================

export function GameProvider({ children }: { children: React.ReactNode }) {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GameUser | null>(null);
  const [activeRound, setActiveRound] = useState<Round | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfig | null>(null);
  const [allRounds, setAllRounds] = useState<Round[]>([]);

  // Refs for cleanup
  const subscriptionsRef = useRef<any[]>([]);

  // ============================================
  // LOAD INITIAL DATA
  // ============================================

  const loadInitialData = useCallback(async () => {
    if (!isRealtimeMode()) {
      // Mock mode
      setPrizeConfig(MOCK_PRIZE_CONFIG);
      setIsConnected(true);
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // Load active round
      const { data: rounds, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .in('status', ['open', 'closed'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (roundsError) throw roundsError;

      const currentRound = rounds?.[0] || null;
      setActiveRound(currentRound);

      // Load all rounds for admin
      const { data: allRoundsData } = await supabase
        .from('rounds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      setAllRounds(allRoundsData || []);

      // Load guesses for active round
      if (currentRound) {
        const { data: guessData } = await supabase
          .from('guesses')
          .select('*')
          .eq('round_id', currentRound.id)
          .order('submitted_at', { ascending: true });

        setGuesses(guessData || []);

        // Load chat messages
        const { data: chatData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('round_id', currentRound.id)
          .order('created_at', { ascending: true })
          .limit(100);

        setChatMessages(chatData || []);
      }

      // Load prize config
      const { data: prizeData } = await supabase
        .from('prize_config')
        .select('*')
        .limit(1)
        .single();

      setPrizeConfig(prizeData);
      setIsConnected(true);
    } catch (err: any) {
      console.error('[GameContext] Load error:', err);
      setError(err.message || 'Failed to load game data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  const setupRealtimeSubscriptions = useCallback(() => {
    if (!isRealtimeMode()) return;

    // Cleanup existing subscriptions
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];

    // Subscribe to rounds changes
    const roundsSub = supabase
      .channel('rounds-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, (payload: any) => {
        console.log('[Realtime] Rounds change:', payload.eventType);

        if (payload.eventType === 'INSERT') {
          const newRound = payload.new as Round;
          setAllRounds((prev) => [newRound, ...prev]);
          if (newRound.status === 'open' || newRound.status === 'closed') {
            setActiveRound(newRound);
            setGuesses([]);
            setChatMessages([]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedRound = payload.new as Round;
          setAllRounds((prev) => prev.map((r) => (r.id === updatedRound.id ? updatedRound : r)));
          if (activeRound?.id === updatedRound.id) {
            setActiveRound(updatedRound);
          }
        }
      })
      .subscribe();

    subscriptionsRef.current.push(roundsSub);

    // Subscribe to prize_config changes
    const prizeSub = supabase
      .channel('prize-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prize_config' }, (payload: any) => {
        console.log('[Realtime] Prize config change:', payload.eventType);
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setPrizeConfig(payload.new as PrizeConfig);
        }
      })
      .subscribe();

    subscriptionsRef.current.push(prizeSub);
  }, [activeRound?.id]);

  // Subscribe to guesses and chat for active round
  useEffect(() => {
    if (!isRealtimeMode() || !activeRound?.id) return;

    const guessesSub = supabase
      .channel(`guesses-${activeRound.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'guesses',
        filter: `round_id=eq.${activeRound.id}`,
      }, (payload: any) => {
        console.log('[Realtime] New guess:', payload.new);
        setGuesses((prev) => [...prev, payload.new as Guess]);
      })
      .subscribe();

    const chatSub = supabase
      .channel(`chat-${activeRound.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `round_id=eq.${activeRound.id}`,
      }, (payload: any) => {
        console.log('[Realtime] New chat:', payload.new);
        setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      guessesSub.unsubscribe();
      chatSub.unsubscribe();
    };
  }, [activeRound?.id]);

  // ============================================
  // AUTO-CLOSE ROUND (Timer Check)
  // ============================================

  useEffect(() => {
    if (!activeRound || activeRound.status !== 'open') return;

    const checkTimer = () => {
      const now = Date.now();
      const endTime = new Date(activeRound.end_time).getTime();

      if (now >= endTime) {
        // Auto-close round
        closeRound(activeRound.id);
      }
    };

    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRound?.id, activeRound?.status, activeRound?.end_time]);

  // ============================================
  // INITIALIZE
  // ============================================

  useEffect(() => {
    loadInitialData();
    setupRealtimeSubscriptions();

    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    };
  }, [loadInitialData, setupRealtimeSubscriptions]);

  // ============================================
  // ACTIONS
  // ============================================

  const createRound = async (
    roundNumber: number,
    durationMinutes: number,
    prize: string,
    blockNumber?: number
  ): Promise<{ error: any }> => {
    if (!isRealtimeMode()) {
      return { error: 'Mock mode - cannot create round' };
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

    const { error } = await supabase.from('rounds').insert({
      round_number: roundNumber,
      status: 'open',
      prize,
      block_number: blockNumber || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });

    if (!error) {
      // Send system message
      await sendChatMessage(`🎮 Round #${roundNumber} has started! Submit your predictions now!`, 'system');
    }

    return { error };
  };

  const closeRound = async (roundId: string): Promise<{ error: any }> => {
    if (!isRealtimeMode()) {
      return { error: 'Mock mode' };
    }

    const { error } = await supabase
      .from('rounds')
      .update({ status: 'closed' })
      .eq('id', roundId);

    if (!error) {
      await sendChatMessage('⏰ Round closed! Waiting for results...', 'system');
    }

    return { error };
  };

  const updateRoundResult = async (
    roundId: string,
    actualTxCount: number,
    blockHash: string
  ): Promise<{ error: any }> => {
    if (!isRealtimeMode()) {
      return { error: 'Mock mode' };
    }

    // Get all guesses for this round
    const { data: roundGuesses } = await supabase
      .from('guesses')
      .select('*')
      .eq('round_id', roundId)
      .order('submitted_at', { ascending: true });

    if (!roundGuesses || roundGuesses.length === 0) {
      return { error: 'No guesses found' };
    }

    // Calculate winner (closest guess, earliest submission as tiebreaker)
    const sorted = [...roundGuesses].sort((a, b) => {
      const diffA = Math.abs(a.guess - actualTxCount);
      const diffB = Math.abs(b.guess - actualTxCount);
      if (diffA !== diffB) return diffA - diffB;
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    });

    const winner = sorted[0];
    const secondPlace = sorted[1] || null;
    const isJackpot = winner.guess === actualTxCount;

    // Update round
    const { error } = await supabase
      .from('rounds')
      .update({
        status: 'finished',
        actual_tx_count: actualTxCount,
        block_hash: blockHash,
        winner_fid: winner.fid,
        second_place_fid: secondPlace?.fid || null,
      })
      .eq('id', roundId);

    if (!error) {
      // Announce winner
      const winnerMsg = isJackpot
        ? `🎰 JACKPOT! @${winner.username} guessed EXACTLY ${actualTxCount} transactions! 🎉`
        : `🏆 Winner: @${winner.username} with ${winner.guess} txs (actual: ${actualTxCount})`;

      await sendChatMessage(winnerMsg, 'winner');

      if (secondPlace) {
        await sendChatMessage(`🥈 Second place: @${secondPlace.username} with ${secondPlace.guess} txs`, 'system');
      }
    }

    return { error };
  };

  const submitGuess = async (guess: number): Promise<{ error: any }> => {
    if (!user || !activeRound) {
      return { error: 'Not authenticated or no active round' };
    }

    if (activeRound.status !== 'open') {
      return { error: 'Round is not open for guesses' };
    }

    // Check if already submitted
    const existingGuess = guesses.find((g) => g.fid === user.fid);
    if (existingGuess) {
      return { error: 'You already submitted a guess for this round' };
    }

    if (!isRealtimeMode()) {
      // Mock mode - add locally
      const mockGuess: Guess = {
        id: `mock-${Date.now()}`,
        round_id: activeRound.id,
        fid: user.fid,
        username: user.username,
        pfp_url: user.pfpUrl || null,
        guess,
        submitted_at: new Date().toISOString(),
      };
      setGuesses((prev) => [...prev, mockGuess]);
      return { error: null };
    }

    const { error } = await supabase.from('guesses').insert({
      round_id: activeRound.id,
      fid: user.fid,
      username: user.username,
      pfp_url: user.pfpUrl || null,
      guess,
    });

    if (!error) {
      // Send guess announcement to chat
      await sendChatMessage(`🎯 I predict ${guess.toLocaleString()} transactions!`, 'guess');
    }

    return { error };
  };

  const sendChatMessage = async (
    message: string,
    type: 'chat' | 'guess' | 'system' | 'winner' = 'chat'
  ): Promise<{ error: any }> => {
    if (!activeRound) {
      return { error: 'No active round' };
    }

    // System messages don't need user
    const fid = user?.fid || 0;
    const username = user?.username || 'System';
    const pfpUrl = user?.pfpUrl || null;

    if (!isRealtimeMode()) {
      // Mock mode
      const mockMsg: ChatMessage = {
        id: `mock-${Date.now()}`,
        round_id: activeRound.id,
        fid,
        username,
        pfp_url: pfpUrl,
        message,
        type,
        created_at: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, mockMsg]);
      return { error: null };
    }

    const { error } = await supabase.from('chat_messages').insert({
      round_id: activeRound.id,
      fid,
      username,
      pfp_url: pfpUrl,
      message,
      type,
    });

    return { error };
  };

  const updatePrizeConfig = async (config: Partial<PrizeConfig>): Promise<{ error: any }> => {
    if (!isRealtimeMode()) {
      setPrizeConfig((prev) => prev ? { ...prev, ...config } : null);
      return { error: null };
    }

    // Get existing config ID
    const { data: existing } = await supabase
      .from('prize_config')
      .select('id')
      .limit(1)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('prize_config')
        .update({
          jackpot: config.jackpot,
          first_place: config.first_place,
          second_place: config.second_place,
          currency: config.currency,
          token_address: config.token_address,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      return { error };
    } else {
      const { error } = await supabase.from('prize_config').insert({
        jackpot: config.jackpot || 5000,
        first_place: config.first_place || 1000,
        second_place: config.second_place || 500,
        currency: config.currency || '$SECOND',
        token_address: config.token_address || null,
      });

      return { error };
    }
  };

  const refreshData = async () => {
    setIsLoading(true);
    await loadInitialData();
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: GameContextType = {
    // State
    isConnected,
    isLoading,
    error,
    user,
    activeRound,
    guesses,
    chatMessages,
    prizeConfig,
    allRounds,

    // Actions
    setUser,
    createRound,
    closeRound,
    updateRoundResult,
    submitGuess,
    sendChatMessage,
    updatePrizeConfig,
    refreshData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
