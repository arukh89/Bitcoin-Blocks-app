'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
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
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  user: GameUser | null;
  activeRounds: Round[];
  selectedRound: Round | null;
  guesses: Guess[];
  chatMessages: ChatMessage[];
  prizeConfig: PrizeConfig | null;
  allRounds: Round[];
  latestBlockHeight: number | null;
}

interface GameActions {
  setUser: (user: GameUser | null) => void;
  selectRound: (round: Round | null) => void;
  createRound: (durationMinutes: number, prize: string, blockNumber?: number) => Promise<{ error: any; roundNumber?: number }>;
  closeRound: (roundId: string) => Promise<{ error: any }>;
  updateRoundResult: (roundId: string, actualTxCount: number, blockHash: string) => Promise<{ error: any }>;
  submitGuess: (guess: number, roundId?: string) => Promise<{ error: any }>;
  sendChatMessage: (message: string, type?: 'chat' | 'guess' | 'system' | 'winner', roundId?: string) => Promise<{ error: any }>;
  updatePrizeConfig: (config: Partial<PrizeConfig>) => Promise<{ error: any }>;
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
// PROVIDER
// ============================================

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<GameUser | null>(null);
  const [activeRounds, setActiveRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [prizeConfig, setPrizeConfig] = useState<PrizeConfig | null>(null);
  const [allRounds, setAllRounds] = useState<Round[]>([]);
  const [latestBlockHeight, setLatestBlockHeight] = useState<number | null>(null);

  const subscriptionsRef = useRef<any[]>([]);
  const processingRoundsRef = useRef<Set<string>>(new Set());
  const mountedRef = useRef(true);
  const activeRoundsRef = useRef<Round[]>([]);
  const selectedRoundRef = useRef<Round | null>(null);
  const userRef = useRef<GameUser | null>(null);

  useEffect(() => { activeRoundsRef.current = activeRounds; }, [activeRounds]);
  useEffect(() => { selectedRoundRef.current = selectedRound; }, [selectedRound]);
  useEffect(() => { userRef.current = user; }, [user]);

  // Auto-select first active round if none selected
  useEffect(() => {
    if (!selectedRound && activeRounds.length > 0) {
      setSelectedRound(activeRounds[0]);
    } else if (selectedRound && !activeRounds.find(r => r.id === selectedRound.id)) {
      setSelectedRound(activeRounds[0] || null);
    }
  }, [activeRounds, selectedRound]);

  const selectRound = (round: Round | null) => {
    setSelectedRound(round);
    if (round) {
      loadRoundData(round.id);
    }
  };

  const loadRoundData = async (roundId: string) => {
    const { data: guessData } = await supabase
      .from('guesses')
      .select('*')
      .eq('round_id', roundId)
      .order('submitted_at', { ascending: true });

    if (mountedRef.current) setGuesses(guessData || []);

    const { data: chatData } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('round_id', roundId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (mountedRef.current) setChatMessages(chatData || []);
  };


  // ============================================
  // FETCH BLOCK DATA FROM MEMPOOL
  // ============================================

  const fetchBlockByHeight = useCallback(async (height: number) => {
    try {
      const response = await fetch(`/api/mempool?action=block-by-height&height=${height}`);
      if (!response.ok) return null;
      return await response.json();
    } catch (err) {
      console.error('[GameContext] Failed to fetch block:', err);
      return null;
    }
  }, []);

  const fetchLatestBlock = useCallback(async () => {
    try {
      const response = await fetch('/api/mempool?action=recent-blocks');
      if (!response.ok) return null;
      const blocks = await response.json();
      return blocks[0] || null;
    } catch (err) {
      console.error('[GameContext] Failed to fetch latest block:', err);
      return null;
    }
  }, []);

  // ============================================
  // AUTO-CLOSE & FINALIZE ROUND
  // ============================================

  const finalizeRound = useCallback(async (round: Round, blockData: { tx_count: number; hash: string }) => {
    if (processingRoundsRef.current.has(round.id)) return;
    processingRoundsRef.current.add(round.id);

    try {
      console.log('[GameContext] Finalizing round:', round.id, 'Block:', blockData);

      const { data: roundGuesses } = await supabase
        .from('guesses')
        .select('*')
        .eq('round_id', round.id)
        .order('submitted_at', { ascending: true });

      if (!roundGuesses || roundGuesses.length === 0) {
        await supabase
          .from('rounds')
          .update({ 
            status: 'finished', 
            actual_tx_count: blockData.tx_count,
            block_hash: blockData.hash 
          })
          .eq('id', round.id);

        await supabase.from('chat_messages').insert({
          round_id: round.id,
          fid: 0,
          username: 'System',
          pfp_url: null,
          message: `🔔 Round #${round.round_number} finished! Block #${round.block_number} had ${blockData.tx_count.toLocaleString()} transactions. No predictions were made.`,
          type: 'system',
        });

        processingRoundsRef.current.delete(round.id);
        return;
      }

      // Calculate winner
      const sorted = [...roundGuesses].sort((a, b) => {
        const diffA = Math.abs(a.guess - blockData.tx_count);
        const diffB = Math.abs(b.guess - blockData.tx_count);
        if (diffA !== diffB) return diffA - diffB;
        return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      });

      const winner = sorted[0];
      const secondPlace = sorted[1] || null;
      const isJackpot = winner.guess === blockData.tx_count;
      const claimDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { error: updateError } = await supabase
        .from('rounds')
        .update({
          status: 'finished',
          actual_tx_count: blockData.tx_count,
          block_hash: blockData.hash,
          winner_fid: winner.fid,
          winner_username: winner.username,
          second_place_fid: secondPlace?.fid || null,
          second_place_username: secondPlace?.username || null,
          claim_deadline: claimDeadline,
        })
        .eq('id', round.id);

      if (updateError) {
        console.error('[GameContext] Failed to update round:', updateError);
        processingRoundsRef.current.delete(round.id);
        return;
      }

      // Send winner announcements
      const messages: Array<{
        round_id: string;
        fid: number;
        username: string;
        pfp_url: null;
        message: string;
        type: 'chat' | 'guess' | 'system' | 'winner';
      }> = [
        {
          round_id: round.id,
          fid: 0,
          username: 'System',
          pfp_url: null,
          message: `🔔 Round #${round.round_number} is now CLOSED! Block #${round.block_number} has been mined with ${blockData.tx_count.toLocaleString()} transactions!`,
          type: 'system',
        },
      ];

      if (isJackpot) {
        messages.push({
          round_id: round.id,
          fid: 0,
          username: 'System',
          pfp_url: null,
          message: `🎰💰 JACKPOT WINNER! 💰🎰 @${winner.username} guessed EXACTLY ${blockData.tx_count.toLocaleString()} transactions and wins the JACKPOT! 🎉🎉🎉`,
          type: 'winner',
        });
      } else {
        const winnerDiff = Math.abs(winner.guess - blockData.tx_count);
        messages.push({
          round_id: round.id,
          fid: 0,
          username: 'System',
          pfp_url: null,
          message: `🏆 WINNER: @${winner.username} with ${winner.guess.toLocaleString()} txs (actual: ${blockData.tx_count.toLocaleString()}, diff: ${winnerDiff.toLocaleString()})`,
          type: 'winner',
        });
      }

      if (secondPlace) {
        const secondDiff = Math.abs(secondPlace.guess - blockData.tx_count);
        messages.push({
          round_id: round.id,
          fid: 0,
          username: 'System',
          pfp_url: null,
          message: `🥈 2nd Place: @${secondPlace.username} with ${secondPlace.guess.toLocaleString()} txs (diff: ${secondDiff.toLocaleString()})`,
          type: 'system',
        });
      }

      messages.push({
        round_id: round.id,
        fid: 0,
        username: 'System',
        pfp_url: null,
        message: `💰 Winners can now claim their prizes! Check the "Claim Prize" section.`,
        type: 'system',
      });

      await supabase.from('chat_messages').insert(messages);

      // Auto set prize in smart contract
      try {
        const winnerRes = await fetch(`${window.location.origin}/api/user-address?fid=${winner.fid}`);
        const winnerData = await winnerRes.json();
        
        if (winnerData.walletAddress) {
          const prizeAmount = round.first_place_prize || 1000;
          
          const setPrizePayload: {
            roundId: string;
            winnerAddress: string;
            prizeAmount: number;
            secondPlaceAddress?: string;
            secondPrizeAmount?: number;
          } = {
            roundId: round.id,
            winnerAddress: winnerData.walletAddress,
            prizeAmount,
          };

          if (secondPlace) {
            const secondRes = await fetch(`${window.location.origin}/api/user-address?fid=${secondPlace.fid}`);
            const secondData = await secondRes.json();
            if (secondData.walletAddress) {
              setPrizePayload.secondPlaceAddress = secondData.walletAddress;
              setPrizePayload.secondPrizeAmount = round.second_place_prize || 500;
            }
          }

          const setPrizeRes = await fetch(`${window.location.origin}/api/set-prize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(setPrizePayload),
          });
          
          const setPrizeResult = await setPrizeRes.json();
          if (setPrizeResult.success) {
            console.log('[GameContext] Prize set in contract:', setPrizeResult);
          } else {
            console.error('[GameContext] Failed to set prize:', setPrizeResult.error);
          }
        }
      } catch (prizeErr) {
        console.error('[GameContext] Error setting prize in contract:', prizeErr);
      }

      console.log('[GameContext] Round finalized successfully!');
    } catch (err) {
      console.error('[GameContext] Error finalizing round:', err);
    } finally {
      processingRoundsRef.current.delete(round.id);
    }
  }, []);


  // ============================================
  // BLOCK MONITORING
  // ============================================

  useEffect(() => {
    const checkTargetBlocks = async () => {
      const currentActiveRounds = activeRoundsRef.current;
      if (currentActiveRounds.length === 0) return;

      try {
        const latestBlock = await fetchLatestBlock();
        if (!latestBlock) return;

        setLatestBlockHeight(latestBlock.height);

        for (const round of currentActiveRounds) {
          if (round.status !== 'open' && round.status !== 'closed') continue;
          if (!round.block_number) continue;
          if (processingRoundsRef.current.has(round.id)) continue;

          if (latestBlock.height >= round.block_number) {
            console.log('[GameContext] Target block reached for round', round.round_number, '! Latest:', latestBlock.height, 'Target:', round.block_number);

            const targetBlock = await fetchBlockByHeight(round.block_number);
            if (targetBlock && targetBlock.tx_count) {
              await finalizeRound(round, {
                tx_count: targetBlock.tx_count,
                hash: targetBlock.hash,
              });
            }
          }
        }
      } catch (err) {
        console.error('[GameContext] Error checking target blocks:', err);
      }
    };

    checkTargetBlocks();
    const interval = setInterval(checkTargetBlocks, 10000);
    return () => clearInterval(interval);
  }, [activeRounds, fetchLatestBlock, fetchBlockByHeight, finalizeRound]);

  // ============================================
  // TIMER-BASED AUTO-CLOSE
  // ============================================

  useEffect(() => {
    if (activeRounds.length === 0) return;

    const checkTimers = () => {
      const currentActiveRounds = activeRoundsRef.current;
      const now = Date.now();

      for (const round of currentActiveRounds) {
        if (round.status !== 'open') continue;
        if (!round.end_time) continue;
        if (processingRoundsRef.current.has(round.id)) continue;

        const endTime = new Date(round.end_time).getTime();

        if (now >= endTime) {
          supabase
            .from('rounds')
            .update({ status: 'closed' })
            .eq('id', round.id)
            .then(() => {
              console.log('[GameContext] Round', round.round_number, 'closed by timer');
            });
        }
      }
    };

    const interval = setInterval(checkTimers, 1000);
    return () => clearInterval(interval);
  }, [activeRounds]);

  // ============================================
  // LOAD INITIAL DATA
  // ============================================

  const loadInitialData = useCallback(async () => {
    try {
      setError(null);

      const { data: activeRoundsData, error: roundsError } = await supabase
        .from('rounds')
        .select('*')
        .in('status', ['open', 'closed'])
        .order('created_at', { ascending: false });

      if (roundsError) throw roundsError;
      if (!mountedRef.current) return;

      setActiveRounds(activeRoundsData || []);

      const { data: allRoundsData } = await supabase
        .from('rounds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (!mountedRef.current) return;
      setAllRounds(allRoundsData || []);

      const firstActiveRound = activeRoundsData?.[0];
      if (firstActiveRound) {
        setSelectedRound(firstActiveRound);
        
        const { data: guessData } = await supabase
          .from('guesses')
          .select('*')
          .eq('round_id', firstActiveRound.id)
          .order('submitted_at', { ascending: true });

        if (!mountedRef.current) return;
        setGuesses(guessData || []);

        const { data: chatData } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('round_id', firstActiveRound.id)
          .order('created_at', { ascending: true })
          .limit(100);

        if (!mountedRef.current) return;
        setChatMessages(chatData || []);
      } else {
        setSelectedRound(null);
        setGuesses([]);
        setChatMessages([]);
      }

      const { data: prizeData } = await supabase
        .from('prize_config')
        .select('*')
        .limit(1)
        .single();

      if (!mountedRef.current) return;
      setPrizeConfig(prizeData);
      setIsConnected(true);
    } catch (err: any) {
      console.error('[GameContext] Load error:', err);
      if (mountedRef.current) {
        setError(err.message || 'Failed to load game data');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);


  // ============================================
  // REALTIME SUBSCRIPTIONS
  // ============================================

  const setupRealtimeSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((sub) => {
      try { sub.unsubscribe(); } catch {}
    });
    subscriptionsRef.current = [];

    const roundsSub = supabase
      .channel('rounds-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, (payload: any) => {
        if (!mountedRef.current) return;
        console.log('[Realtime] Rounds change:', payload.eventType);

        if (payload.eventType === 'INSERT') {
          const newRound = payload.new as Round;
          setAllRounds((prev) => [newRound, ...prev]);
          if (newRound.status === 'open' || newRound.status === 'closed') {
            setActiveRounds((prev) => [newRound, ...prev]);
            setSelectedRound(newRound);
            setGuesses([]);
            setChatMessages([]);
          }
        } else if (payload.eventType === 'UPDATE') {
          const updatedRound = payload.new as Round;
          setAllRounds((prev) => prev.map((r) => (r.id === updatedRound.id ? updatedRound : r)));
          
          if (updatedRound.status === 'finished') {
            setActiveRounds((prev) => prev.filter((r) => r.id !== updatedRound.id));
            if (selectedRoundRef.current?.id === updatedRound.id) {
              setTimeout(() => {
                if (mountedRef.current) {
                  setGuesses([]);
                }
              }, 5000);
            }
          } else {
            setActiveRounds((prev) => prev.map((r) => (r.id === updatedRound.id ? updatedRound : r)));
            if (selectedRoundRef.current?.id === updatedRound.id) {
              setSelectedRound(updatedRound);
            }
          }
        }
      })
      .subscribe();

    subscriptionsRef.current.push(roundsSub);

    const prizeSub = supabase
      .channel('prize-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'prize_config' }, (payload: any) => {
        if (!mountedRef.current) return;
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          setPrizeConfig(payload.new as PrizeConfig);
        }
      })
      .subscribe();

    subscriptionsRef.current.push(prizeSub);
  }, []);

  useEffect(() => {
    if (!selectedRound?.id) return;

    const guessesSub = supabase
      .channel(`guesses-${selectedRound.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'guesses',
        filter: `round_id=eq.${selectedRound.id}`,
      }, (payload: any) => {
        if (!mountedRef.current) return;
        setGuesses((prev) => [...prev, payload.new as Guess]);
      })
      .subscribe();

    const chatSub = supabase
      .channel(`chat-${selectedRound.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `round_id=eq.${selectedRound.id}`,
      }, (payload: any) => {
        if (!mountedRef.current) return;
        setChatMessages((prev) => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => {
      try { guessesSub.unsubscribe(); } catch {}
      try { chatSub.unsubscribe(); } catch {}
    };
  }, [selectedRound?.id]);

  // ============================================
  // INITIALIZE
  // ============================================

  useEffect(() => {
    mountedRef.current = true;
    loadInitialData();
    setupRealtimeSubscriptions();

    return () => {
      mountedRef.current = false;
      subscriptionsRef.current.forEach((sub) => {
        try { sub.unsubscribe(); } catch {}
      });
    };
  }, [loadInitialData, setupRealtimeSubscriptions]);


  // ============================================
  // ACTIONS
  // ============================================

  const createRound = async (
    durationMinutes: number,
    prize: string,
    blockNumber?: number
  ): Promise<{ error: any; roundNumber?: number }> => {
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    const currentPrizeConfig = prizeConfig;

    const { data, error } = await supabase.from('rounds').insert({
      status: 'open',
      prize,
      block_number: blockNumber || null,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      first_place_prize: currentPrizeConfig?.first_place || 1000,
      second_place_prize: currentPrizeConfig?.second_place || 500,
      prize_currency: currentPrizeConfig?.currency || '$SECOND',
    }).select().single();

    if (!error && data) {
      const targetMsg = blockNumber 
        ? `Target: Block #${blockNumber.toLocaleString()}`
        : `Duration: ${durationMinutes} minutes`;
      
      await supabase.from('chat_messages').insert({
        round_id: data.id,
        fid: 0,
        username: 'System',
        pfp_url: null,
        message: `🎮 Round #${data.round_number} has started! ${targetMsg}. Submit your predictions now!`,
        type: 'system',
      });

      return { error: null, roundNumber: data.round_number };
    }

    return { error };
  };

  const closeRound = async (roundId: string): Promise<{ error: any }> => {
    const { error } = await supabase
      .from('rounds')
      .update({ status: 'closed' })
      .eq('id', roundId);

    return { error };
  };

  const updateRoundResult = async (
    roundId: string,
    actualTxCount: number,
    blockHash: string
  ): Promise<{ error: any }> => {
    const round = allRounds.find(r => r.id === roundId);
    if (!round) {
      return { error: 'Round not found' };
    }

    await finalizeRound(round, { tx_count: actualTxCount, hash: blockHash });
    return { error: null };
  };

  const submitGuess = async (guess: number, roundId?: string): Promise<{ error: any }> => {
    const currentUser = userRef.current;
    const targetRound = roundId 
      ? activeRoundsRef.current.find(r => r.id === roundId) 
      : selectedRoundRef.current;

    if (!currentUser || !targetRound) {
      return { error: 'Not authenticated or no active round' };
    }

    if (targetRound.status !== 'open') {
      return { error: 'Round is not open for guesses' };
    }

    const { data: existingGuesses } = await supabase
      .from('guesses')
      .select('id')
      .eq('round_id', targetRound.id)
      .eq('fid', currentUser.fid)
      .limit(1);

    if (existingGuesses && existingGuesses.length > 0) {
      return { error: 'You already submitted a guess for this round' };
    }

    const { error } = await supabase.from('guesses').insert({
      round_id: targetRound.id,
      fid: currentUser.fid,
      username: currentUser.username,
      pfp_url: currentUser.pfpUrl || null,
      guess,
    });

    if (!error) {
      await supabase.from('chat_messages').insert({
        round_id: targetRound.id,
        fid: currentUser.fid,
        username: currentUser.username,
        pfp_url: currentUser.pfpUrl || null,
        message: `🎯 I predict ${guess.toLocaleString()} transactions!`,
        type: 'guess',
      });
    }

    return { error };
  };

  const sendChatMessage = async (
    message: string,
    type: 'chat' | 'guess' | 'system' | 'winner' = 'chat',
    roundId?: string
  ): Promise<{ error: any }> => {
    const targetRound = roundId 
      ? activeRoundsRef.current.find(r => r.id === roundId) 
      : selectedRoundRef.current;
      
    if (!targetRound) {
      return { error: 'No active round' };
    }

    const currentUser = userRef.current;
    const fid = currentUser?.fid || 0;
    const username = currentUser?.username || 'System';
    const pfpUrl = currentUser?.pfpUrl || null;

    const { error } = await supabase.from('chat_messages').insert({
      round_id: targetRound.id,
      fid,
      username,
      pfp_url: pfpUrl,
      message,
      type,
    });

    return { error };
  };

  const updatePrizeConfig = async (config: Partial<PrizeConfig>): Promise<{ error: any }> => {
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
    isConnected,
    isLoading,
    error,
    user,
    activeRounds,
    selectedRound,
    guesses,
    chatMessages,
    prizeConfig,
    allRounds,
    latestBlockHeight,
    setUser,
    selectRound,
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
