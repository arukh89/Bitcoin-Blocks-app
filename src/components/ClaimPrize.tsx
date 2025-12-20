'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount, useWriteContract, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'viem/chains';
import { useGame } from '@/context/GameContext';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import { supabase } from '@/lib/supabase';
import { ACTIVE_CONFIG, CLAIM_CONTRACT_ABI, roundIdToBytes32 } from '@/config/contracts';

const CLAIM_DEADLINE_HOURS = 24;

export function ClaimPrize() {
  const { user } = useFarcasterUser();
  const { address, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const { allRounds, prizeConfig, refreshData } = useGame();
  const [isExpanded, setIsExpanded] = useState(false);
  const [claimingRoundId, setClaimingRoundId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [claimSuccess, setClaimSuccess] = useState(false);

  const { writeContract, isPending: isWriting } = useWriteContract();

  const wonRounds = useMemo(() => {
    if (!user?.fid) return [];

    return allRounds.filter((round) => {
      if (round.status !== 'finished') return false;
      
      const isFirstPlace = round.winner_fid === user.fid;
      const isSecondPlace = round.second_place_fid === user.fid;
      
      if (!isFirstPlace && !isSecondPlace) return false;
      if (isFirstPlace && round.winner_claimed) return false;
      if (isSecondPlace && round.second_place_claimed) return false;
      
      const roundEndTime = new Date(round.end_time).getTime();
      const deadline = roundEndTime + (CLAIM_DEADLINE_HOURS * 60 * 60 * 1000);
      if (Date.now() > deadline) return false;
      
      return true;
    });
  }, [allRounds, user?.fid]);

  if (!user || wonRounds.length === 0) {
    return null;
  }

  const isCorrectChain = chainId === ACTIVE_CONFIG.chainId;

  const handleSwitchChain = async () => {
    try {
      await switchChain({ chainId: baseSepolia.id });
    } catch {
      setClaimError('Failed to switch network. Please switch manually to Base Sepolia.');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true
      }),
    };
  };

  const getTimeRemaining = (endTime: string) => {
    const deadline = new Date(endTime).getTime() + (CLAIM_DEADLINE_HOURS * 60 * 60 * 1000);
    const remaining = deadline - Date.now();
    
    if (remaining <= 0) return 'Expired';
    
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m left`;
  };

  // Get prize amount - use round-specific prize (saved at round creation)
  const getPrizeAmount = (round: typeof allRounds[0], isFirstPlace: boolean) => {
    if (isFirstPlace) {
      return round.first_place_prize || 1000;
    }
    return round.second_place_prize || 500;
  };

  const getPrizeCurrency = (round: typeof allRounds[0]) => {
    return round.prize_currency || '$SECOND';
  };

  const handleClaim = async (roundId: string, isFirstPlace: boolean) => {
    if (!address) {
      setClaimError('Please connect your wallet first');
      return;
    }

    if (!isCorrectChain) {
      setClaimError('Please switch to Base Sepolia network');
      return;
    }

    setClaimingRoundId(roundId);
    setClaimError(null);
    setClaimSuccess(false);

    try {
      const roundIdBytes32 = roundIdToBytes32(roundId);
      
      writeContract({
        address: ACTIVE_CONFIG.claimContract as `0x${string}`,
        abi: CLAIM_CONTRACT_ABI,
        functionName: 'claim',
        args: [roundIdBytes32],
      }, {
        onSuccess: async (hash) => {
          console.log('Claim tx submitted:', hash);
          
          const updateData: Record<string, boolean | string> = {};
          if (isFirstPlace) {
            updateData.winner_claimed = true;
            updateData.winner_claim_tx = hash;
          } else {
            updateData.second_place_claimed = true;
            updateData.second_place_claim_tx = hash;
          }
          
          await supabase
            .from('rounds')
            .update(updateData)
            .eq('id', roundId);

          await refreshData();
          setClaimSuccess(true);
          setClaimingRoundId(null);
        },
        onError: (error) => {
          console.error('Claim error:', error);
          // User rejected - don't show error, just reset state
          if (error.message.includes('denied') || error.message.includes('rejected')) {
            setClaimingRoundId(null);
            return;
          }
          if (error.message.includes('No prize for this round')) {
            setClaimError('Prize not yet set by admin. Please wait.');
          } else if (error.message.includes('Already claimed')) {
            setClaimError('You have already claimed this prize.');
          } else {
            setClaimError(error.message || 'Failed to claim prize.');
          }
          setClaimingRoundId(null);
          // Auto-clear error after 5 seconds
          setTimeout(() => setClaimError(null), 5000);
        },
      });
    } catch (err: any) {
      setClaimError(err.message || 'Failed to claim prize');
      setClaimingRoundId(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card border-green-500/30 overflow-hidden"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div className="text-left">
            <h2 className="font-bold text-lg text-green-400">Claim Your Prize!</h2>
            <p className="text-xs text-gray-400">
              You have {wonRounds.length} unclaimed prize{wonRounds.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <motion.span animate={{ rotate: isExpanded ? 180 : 0 }} className="text-xl">▼</motion.span>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="p-4 space-y-3">
              {!isCorrectChain && address && (
                <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
                  <p className="text-sm text-yellow-400 mb-2">⚠️ Please switch to Base Sepolia to claim</p>
                  <button
                    onClick={handleSwitchChain}
                    className="w-full py-2 bg-yellow-500 text-black rounded-lg font-bold hover:bg-yellow-600 transition"
                  >
                    Switch to Base Sepolia
                  </button>
                </div>
              )}

              {!address && (
                <div className="p-3 rounded-lg bg-orange-500/20 border border-orange-500/30">
                  <p className="text-sm text-orange-400">🔗 Connect your wallet to claim prizes</p>
                </div>
              )}

              {claimError && (
                <div className="p-3 rounded-lg bg-red-500/20 text-red-400 text-sm">❌ {claimError}</div>
              )}

              {claimSuccess && (
                <div className="p-3 rounded-lg bg-green-500/20 text-green-400 text-sm">
                  ✅ Claim successful! Tokens sent to your wallet.
                </div>
              )}

              {wonRounds.map((round) => {
                const isFirstPlace = round.winner_fid === user?.fid;
                const prize = getPrizeAmount(round, isFirstPlace);
                const currency = getPrizeCurrency(round);
                const isThisRoundClaiming = claimingRoundId === round.id;
                const { date, time } = formatDateTime(round.end_time);
                const timeRemaining = getTimeRemaining(round.end_time);

                return (
                  <div
                    key={round.id}
                    className={`p-4 rounded-lg ${
                      isFirstPlace
                        ? 'bg-yellow-500/10 border border-yellow-500/30'
                        : 'bg-gray-500/10 border border-gray-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-bold text-lg">
                          Round #{round.round_number}
                          {isFirstPlace ? ' 🥇' : ' 🥈'}
                        </p>
                        <p className="text-xs text-gray-400">
                          {isFirstPlace ? '1st Place' : '2nd Place'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-bold ${isFirstPlace ? 'text-yellow-400' : 'text-gray-300'}`}>
                          {prize.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400">{currency}</p>
                      </div>
                    </div>

                    <div className="bg-black/20 rounded-lg p-3 mb-3 text-sm">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <p className="text-gray-500 text-xs">Date</p>
                          <p className="text-gray-300">{date}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Finished At</p>
                          <p className="text-gray-300">{time}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Block</p>
                          <p className="text-orange-400 font-mono">#{round.block_number?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Transactions</p>
                          <p className="text-green-400 font-mono">{round.actual_tx_count?.toLocaleString()}</p>
                        </div>
                      </div>
                      
                      <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between">
                        <span className="text-xs text-gray-500">⏰ Claim Deadline:</span>
                        <span className={`text-xs font-bold ${
                          timeRemaining === 'Expired' ? 'text-red-400' : 'text-cyan-400'
                        }`}>
                          {timeRemaining}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleClaim(round.id, isFirstPlace)}
                      disabled={isWriting || !address || !isCorrectChain}
                      className={`w-full py-3 rounded-lg font-bold transition ${
                        isFirstPlace
                          ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600'
                          : 'bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isThisRoundClaiming ? '⏳ Processing...' : '💰 Claim Prize'}
                    </button>
                  </div>
                );
              })}

              <div className="text-xs text-gray-500 text-center mt-4 space-y-1">
                <p>💡 Claim within 24 hours after round ends</p>
                <p className="font-mono">Contract: {ACTIVE_CONFIG.claimContract.slice(0, 10)}...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
