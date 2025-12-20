'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import { useGame } from '@/context/GameContext';
import { isAdminFid, APP_CONFIG } from '@/config/app-config';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useFarcasterUser();
  const {
    activeRound,
    allRounds,
    prizeConfig,
    guesses,
    createRound,
    closeRound,
    updateRoundResult,
    updatePrizeConfig,
    setUser,
  } = useGame();

  // Form states
  const [roundNumber, setRoundNumber] = useState('');
  const [duration, setDuration] = useState('10');
  const [prize, setPrize] = useState('5,000 $SECOND');
  const [blockNumber, setBlockNumber] = useState('');

  const [actualTxCount, setActualTxCount] = useState('');
  const [blockHash, setBlockHash] = useState('');

  const [jackpot, setJackpot] = useState('5000');
  const [firstPlace, setFirstPlace] = useState('1000');
  const [secondPlace, setSecondPlace] = useState('500');
  const [currency, setCurrency] = useState('$SECOND');
  const [tokenAddress, setTokenAddress] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync user to GameContext
  useEffect(() => {
    if (user) {
      setUser({
        fid: user.fid,
        username: user.username || `fid:${user.fid}`,
        displayName: user.displayName,
        pfpUrl: user.pfpUrl,
        isAdmin: isAdminFid(user.fid),
      });
    }
  }, [user, setUser]);

  // Load prize config into form
  useEffect(() => {
    if (prizeConfig) {
      setJackpot(String(prizeConfig.jackpot));
      setFirstPlace(String(prizeConfig.first_place));
      setSecondPlace(String(prizeConfig.second_place));
      setCurrency(prizeConfig.currency);
      setTokenAddress(prizeConfig.token_address || '');
    }
  }, [prizeConfig]);

  // Auto-set next round number
  useEffect(() => {
    if (allRounds.length > 0) {
      const maxRound = Math.max(...allRounds.map((r) => r.round_number));
      setRoundNumber(String(maxRound + 1));
    } else {
      setRoundNumber('1');
    }
  }, [allRounds]);

  // Check admin access
  const isAdmin = isAdminFid(user?.fid);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-4">You don&apos;t have admin privileges.</p>
          <p className="text-sm text-gray-500 mb-4">
            Admin FIDs: {APP_CONFIG.adminFids.join(', ')}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-orange-500 rounded-lg hover:bg-orange-600 transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  // Handlers
  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await createRound(
      parseInt(roundNumber),
      parseInt(duration),
      prize,
      blockNumber ? parseInt(blockNumber) : undefined
    );

    if (error) {
      showMessage('error', `Failed to create round: ${error.message || error}`);
    } else {
      showMessage('success', `Round #${roundNumber} created successfully!`);
      setRoundNumber(String(parseInt(roundNumber) + 1));
    }

    setIsSubmitting(false);
  };

  const handleCloseRound = async () => {
    if (!activeRound) return;
    setIsSubmitting(true);

    const { error } = await closeRound(activeRound.id);

    if (error) {
      showMessage('error', `Failed to close round: ${error.message || error}`);
    } else {
      showMessage('success', 'Round closed successfully!');
    }

    setIsSubmitting(false);
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRound) return;
    setIsSubmitting(true);

    const { error } = await updateRoundResult(
      activeRound.id,
      parseInt(actualTxCount),
      blockHash
    );

    if (error) {
      showMessage('error', `Failed to update result: ${error.message || error}`);
    } else {
      showMessage('success', 'Round result updated! Winner announced!');
      setActualTxCount('');
      setBlockHash('');
    }

    setIsSubmitting(false);
  };

  const handleFetchBitcoinData = async () => {
    if (!blockNumber) {
      showMessage('error', 'Please enter a block number first');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/mempool?block=${blockNumber}`);
      const data = await response.json();

      if (data.error) {
        showMessage('error', data.error);
      } else {
        setActualTxCount(String(data.tx_count));
        setBlockHash(data.hash);
        showMessage('success', `Fetched block #${blockNumber}: ${data.tx_count} transactions`);
      }
    } catch (err: any) {
      showMessage('error', `Failed to fetch: ${err.message}`);
    }

    setIsSubmitting(false);
  };

  const handleSavePrizeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await updatePrizeConfig({
      jackpot: parseInt(jackpot),
      first_place: parseInt(firstPlace),
      second_place: parseInt(secondPlace),
      currency,
      token_address: tokenAddress || null,
    });

    if (error) {
      showMessage('error', `Failed to save: ${error.message || error}`);
    } else {
      showMessage('success', 'Prize config saved!');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen p-4 pt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              👑 Admin Panel
            </h1>
            <p className="text-gray-400">Manage Bitcoin Blocks game</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition"
          >
            ← Back
          </button>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg mb-6 ${
              message.type === 'success' ? 'bg-green-500/20 border border-green-500/50' : 'bg-red-500/20 border border-red-500/50'
            }`}
          >
            {message.type === 'success' ? '✅' : '❌'} {message.text}
          </motion.div>
        )}

        {/* Current Round Status */}
        <div className="glass-card p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">📊 Current Round Status</h2>
          {activeRound ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-400">Round</p>
                <p className="font-bold">#{activeRound.round_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Status</p>
                <p className={`font-bold ${
                  activeRound.status === 'open' ? 'text-green-400' :
                  activeRound.status === 'closed' ? 'text-yellow-400' : 'text-purple-400'
                }`}>
                  {activeRound.status.toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Guesses</p>
                <p className="font-bold">{guesses.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Prize</p>
                <p className="font-bold">{activeRound.prize}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No active round</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Round */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">🎮 Create New Round</h2>
            <form onSubmit={handleCreateRound} className="space-y-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Round Number</label>
                <input
                  type="number"
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Duration (minutes)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Prize</label>
                <input
                  type="text"
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Target Block # (optional)</label>
                <input
                  type="number"
                  value={blockNumber}
                  onChange={(e) => setBlockNumber(e.target.value)}
                  placeholder="e.g. 875420"
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || (activeRound?.status === 'open')}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold disabled:opacity-50"
              >
                {isSubmitting ? '⏳ Creating...' : '🚀 Create Round'}
              </button>
              {activeRound?.status === 'open' && (
                <p className="text-sm text-yellow-400 text-center">Close current round first</p>
              )}
            </form>
          </div>

          {/* Update Result */}
          <div className="glass-card p-6">
            <h2 className="text-xl font-bold mb-4">📝 Update Round Result</h2>
            {activeRound?.status === 'closed' ? (
              <form onSubmit={handleUpdateResult} className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Actual TX Count</label>
                  <input
                    type="number"
                    value={actualTxCount}
                    onChange={(e) => setActualTxCount(e.target.value)}
                    placeholder="e.g. 2834"
                    className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Block Hash</label>
                  <input
                    type="text"
                    value={blockHash}
                    onChange={(e) => setBlockHash(e.target.value)}
                    placeholder="000000..."
                    className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                    required
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFetchBitcoinData}
                  disabled={isSubmitting || !blockNumber}
                  className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50"
                >
                  🔍 Fetch from Bitcoin Block #{blockNumber || '?'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !actualTxCount || !blockHash}
                  className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Updating...' : '🏆 Determine Winner'}
                </button>
              </form>
            ) : activeRound?.status === 'open' ? (
              <div className="space-y-4">
                <p className="text-yellow-400">Round is still open. Close it first to update results.</p>
                <button
                  onClick={handleCloseRound}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg font-bold disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Closing...' : '⏰ Close Round Now'}
                </button>
              </div>
            ) : (
              <p className="text-gray-400">No active round to update</p>
            )}
          </div>

          {/* Prize Config */}
          <div className="glass-card p-6 lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">💰 Prize Configuration</h2>
            <form onSubmit={handleSavePrizeConfig} className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="text-sm text-gray-400 block mb-1">Jackpot</label>
                <input
                  type="number"
                  value={jackpot}
                  onChange={(e) => setJackpot(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">1st Place</label>
                <input
                  type="number"
                  value={firstPlace}
                  onChange={(e) => setFirstPlace(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">2nd Place</label>
                <input
                  type="number"
                  value={secondPlace}
                  onChange={(e) => setSecondPlace(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 block mb-1">Token Address</label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-orange-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2 md:col-span-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg font-bold disabled:opacity-50"
                >
                  {isSubmitting ? '⏳ Saving...' : '💾 Save Prize Config'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Recent Rounds */}
        <div className="glass-card p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">📜 Recent Rounds</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-white/10">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Prize</th>
                  <th className="pb-2">Block</th>
                  <th className="pb-2">TX Count</th>
                  <th className="pb-2">Winner</th>
                </tr>
              </thead>
              <tbody>
                {allRounds.slice(0, 10).map((round) => (
                  <tr key={round.id} className="border-b border-white/5">
                    <td className="py-2 font-bold">{round.round_number}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        round.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        round.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-purple-500/20 text-purple-400'
                      }`}>
                        {round.status}
                      </span>
                    </td>
                    <td className="py-2">{round.prize}</td>
                    <td className="py-2">{round.block_number || '-'}</td>
                    <td className="py-2">{round.actual_tx_count || '-'}</td>
                    <td className="py-2">{round.winner_fid ? `FID: ${round.winner_fid}` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
