'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { isAdminFid } from '@/config/app-config';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';

export function AdminPanel() {
  const { user } = useFarcasterUser();
  const {
    activeRounds,
    selectedRound,
    allRounds,
    prizeConfig,
    guesses,
    createRound,
    closeRound,
    updateRoundResult,
    updatePrizeConfig,
  } = useGame();

  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'round' | 'result' | 'prize' | 'history'>('round');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedAdminRound, setSelectedAdminRound] = useState<string>('');

  // Form states
  const [duration, setDuration] = useState('10');
  const [blockNumber, setBlockNumber] = useState('');
  const [actualTxCount, setActualTxCount] = useState('');
  const [blockHash, setBlockHash] = useState('');
  const [jackpot, setJackpot] = useState('5000');
  const [firstPlace, setFirstPlace] = useState('1000');
  const [secondPlace, setSecondPlace] = useState('500');
  const [currency, setCurrency] = useState('$SECOND');

  const isAdmin = isAdminFid(user?.fid);

  // Get next round number for display
  const nextRoundNumber = allRounds.length > 0 
    ? Math.max(...allRounds.map((r) => r.round_number)) + 1 
    : 1;

  // Get the round to manage (selected in admin or first active)
  const managedRound = selectedAdminRound 
    ? activeRounds.find(r => r.id === selectedAdminRound) 
    : activeRounds[0];

  useEffect(() => {
    if (activeRounds.length > 0 && !selectedAdminRound) {
      setSelectedAdminRound(activeRounds[0].id);
    }
  }, [activeRounds, selectedAdminRound]);

  useEffect(() => {
    if (prizeConfig) {
      setJackpot(String(prizeConfig.jackpot));
      setFirstPlace(String(prizeConfig.first_place));
      setSecondPlace(String(prizeConfig.second_place));
      setCurrency(prizeConfig.currency);
    }
  }, [prizeConfig]);

  if (!isAdmin) return null;

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleCloseRound = async (roundId: string) => {
    if (!roundId) return;
    setIsSubmitting(true);
    const { error } = await closeRound(roundId);
    showMsg(error ? 'error' : 'success', error ? String(error) : 'Round closed!');
    setIsSubmitting(false);
  };

  const handleFetchBlock = async () => {
    if (!blockNumber) return showMsg('error', 'Enter block number first');
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mempool?block=${blockNumber}`);
      const data = await res.json();
      if (data.error) showMsg('error', data.error);
      else {
        setActualTxCount(String(data.tx_count));
        setBlockHash(data.hash);
        showMsg('success', `Block #${blockNumber}: ${data.tx_count} transactions`);
      }
    } catch (e: any) { showMsg('error', e.message); }
    setIsSubmitting(false);
  };

  // Validate if block already exists in mempool.space
  const validateBlockExists = async (blockNum: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/mempool?block=${blockNum}`);
      const data = await res.json();
      return !data.error && data.tx_count !== undefined;
    } catch {
      return false;
    }
  };

  const handleCreateRoundWithValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If block number is provided, validate it doesn't already exist
    if (blockNumber) {
      setIsSubmitting(true);
      const blockExists = await validateBlockExists(blockNumber);
      if (blockExists) {
        showMsg('error', `⚠️ Block #${blockNumber} already exists. Please choose a future block.`);
        setIsSubmitting(false);
        return;
      }
    }
    
    // Get prize from prizeConfig
    const prizeText = `${prizeConfig?.first_place?.toLocaleString() || '1,000'} ${prizeConfig?.currency || '$SECOND'}`;
    
    setIsSubmitting(true);
    const result = await createRound(parseInt(duration), prizeText, blockNumber ? parseInt(blockNumber) : undefined);
    if (result.error) {
      showMsg('error', String(result.error));
    } else {
      showMsg('success', `Round #${result.roundNumber || nextRoundNumber} created!`);
    }
    setIsSubmitting(false);
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedRound) return;
    setIsSubmitting(true);
    const { error } = await updateRoundResult(managedRound.id, parseInt(actualTxCount), blockHash);
    showMsg(error ? 'error' : 'success', error ? String(error) : 'Winner determined!');
    if (!error) { setActualTxCount(''); setBlockHash(''); }
    setIsSubmitting(false);
  };

  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await updatePrizeConfig({ jackpot: parseInt(jackpot), first_place: parseInt(firstPlace), second_place: parseInt(secondPlace), currency });
    showMsg(error ? 'error' : 'success', error ? String(error) : 'Prize config saved!');
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card border-purple-500/30 overflow-hidden"
    >
      {/* Header - Click to expand/collapse */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">👑</span>
          <div className="text-left">
            <h2 className="font-bold text-lg">Admin Panel</h2>
            <p className="text-xs text-gray-400">Manage rounds, results & prizes</p>
          </div>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="text-xl"
        >
          ▼
        </motion.span>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/10"
          >
            <div className="p-4">
              {/* Message */}
              {message && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-3 rounded-lg mb-4 ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                >
                  {message.type === 'success' ? '✅' : '❌'} {message.text}
                </motion.div>
              )}

              {/* Active Rounds Status */}
              <div className="p-3 rounded-lg bg-white/5 mb-4">
                <p className="text-xs text-gray-400 mb-2">Active Rounds ({activeRounds.length})</p>
                {activeRounds.length > 0 ? (
                  <div className="space-y-2">
                    {activeRounds.map((r) => (
                      <div 
                        key={r.id}
                        onClick={() => setSelectedAdminRound(r.id)}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                          selectedAdminRound === r.id ? 'bg-purple-500/20 border border-purple-500/50' : 'bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold">#{r.round_number}</span>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            r.status === 'open' ? 'bg-green-500/20 text-green-400' :
                            r.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-purple-500/20 text-purple-400'
                          }`}>{r.status}</span>
                          {r.block_number && (
                            <span className="text-xs text-gray-400">Block #{r.block_number}</span>
                          )}
                        </div>
                        {r.status === 'open' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleCloseRound(r.id); }}
                            disabled={isSubmitting}
                            className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-400 rounded hover:bg-yellow-500/30 transition"
                          >
                            Close
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No active rounds</p>
                )}
              </div>

              {/* Tabs */}
              <div className="flex gap-2 mb-4">
                {(['round', 'result', 'prize', 'history'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition ${
                      activeTab === tab ? 'bg-purple-500 text-white' : 'bg-white/10 hover:bg-white/20'
                    }`}
                  >
                    {tab === 'round' && '🎮 Create'}
                    {tab === 'result' && '🏆 Result'}
                    {tab === 'prize' && '💰 Prize'}
                    {tab === 'history' && '📜 History'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              {activeTab === 'round' && (
                <form onSubmit={handleCreateRoundWithValidation} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Next Round (auto)</label>
                      <div className="w-full px-3 py-2 bg-black/50 rounded-lg border border-white/10 text-gray-300 font-bold">
                        #{nextRoundNumber}
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Duration (minutes)</label>
                      <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" required />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 block mb-1">Target Block # (optional)</label>
                    <input type="number" value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} placeholder="e.g. 875420" className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" />
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <p className="text-xs text-gray-400">Prize (from Prize tab)</p>
                    <p className="font-bold text-yellow-400">
                      🏆 1st: {prizeConfig?.first_place?.toLocaleString() || '1,000'} {prizeConfig?.currency || '$SECOND'} | 
                      🥈 2nd: {prizeConfig?.second_place?.toLocaleString() || '500'} {prizeConfig?.currency || '$SECOND'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-bold disabled:opacity-50">
                      {isSubmitting ? '⏳' : '🚀'} Create Round
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'result' && (
                <form onSubmit={handleUpdateResult} className="space-y-3">
                  {managedRound?.status === 'closed' ? (
                    <>
                      <div className="p-2 rounded-lg bg-purple-500/10 text-sm mb-3">
                        Managing: <span className="font-bold">Round #{managedRound.round_number}</span>
                        {managedRound.block_number && <span className="text-gray-400 ml-2">(Block #{managedRound.block_number})</span>}
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Actual TX Count</label>
                        <input type="number" value={actualTxCount} onChange={(e) => setActualTxCount(e.target.value)} placeholder="e.g. 2834" className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" required />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 block mb-1">Block Hash</label>
                        <input type="text" value={blockHash} onChange={(e) => setBlockHash(e.target.value)} placeholder="000000..." className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" required />
                      </div>
                      <button type="button" onClick={handleFetchBlock} disabled={isSubmitting || !managedRound.block_number} className="w-full py-2 bg-blue-500/20 border border-blue-500/50 rounded-lg hover:bg-blue-500/30 transition disabled:opacity-50">
                        🔍 Auto-fetch from Block #{managedRound.block_number || '?'}
                      </button>
                      <button type="submit" disabled={isSubmitting || !actualTxCount || !blockHash} className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold disabled:opacity-50">
                        🏆 Determine Winner
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      {activeRounds.some(r => r.status === 'open') ? '⏳ Close a round first to update results' : '📭 No closed rounds to update'}
                    </div>
                  )}
                </form>
              )}

              {activeTab === 'prize' && (
                <form onSubmit={handleSavePrize} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Jackpot</label>
                      <input type="number" value={jackpot} onChange={(e) => setJackpot(e.target.value)} className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">Currency</label>
                      <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">1st Place</label>
                      <input type="number" value={firstPlace} onChange={(e) => setFirstPlace(e.target.value)} className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">2nd Place</label>
                      <input type="number" value={secondPlace} onChange={(e) => setSecondPlace(e.target.value)} className="w-full px-3 py-2 bg-black/30 rounded-lg border border-white/10 focus:border-purple-500 focus:outline-none" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-lg font-bold disabled:opacity-50">
                    💾 Save Prize Config
                  </button>
                </form>
              )}

              {activeTab === 'history' && (
                <div className="space-y-4">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-lg bg-green-500/10">
                      <p className="text-2xl font-bold text-green-400">
                        {allRounds.filter(r => r.status === 'finished').length}
                      </p>
                      <p className="text-xs text-gray-400">Completed</p>
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10">
                      <p className="text-2xl font-bold text-yellow-400">
                        {allRounds.filter(r => r.status === 'open' || r.status === 'closed').length}
                      </p>
                      <p className="text-xs text-gray-400">Active</p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-500/10">
                      <p className="text-2xl font-bold text-purple-400">
                        {allRounds.length}
                      </p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                  </div>

                  {/* Rounds Table */}
                  <div className="max-h-64 overflow-y-auto">
                    {allRounds.length === 0 ? (
                      <p className="text-center text-gray-400 py-4">No rounds yet</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="text-gray-400 text-xs sticky top-0 bg-gray-900/90">
                          <tr>
                            <th className="text-left pb-2 px-2">#</th>
                            <th className="text-left pb-2 px-2">Status</th>
                            <th className="text-left pb-2 px-2">Block</th>
                            <th className="text-left pb-2 px-2">TX Count</th>
                            <th className="text-left pb-2 px-2">Winner</th>
                            <th className="text-left pb-2 px-2">2nd</th>
                          </tr>
                        </thead>
                        <tbody>
                          {allRounds.map((r) => (
                            <tr key={r.id} className="border-t border-white/5 hover:bg-white/5">
                              <td className="py-2 px-2 font-bold">{r.round_number}</td>
                              <td className="py-2 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs ${
                                  r.status === 'open' ? 'bg-green-500/20 text-green-400' : 
                                  r.status === 'closed' ? 'bg-yellow-500/20 text-yellow-400' : 
                                  'bg-purple-500/20 text-purple-400'
                                }`}>
                                  {r.status}
                                </span>
                              </td>
                              <td className="py-2 px-2 font-mono text-xs">
                                {r.block_number ? `#${r.block_number}` : '-'}
                              </td>
                              <td className="py-2 px-2">
                                {r.actual_tx_count ? (
                                  <span className="text-green-400">{r.actual_tx_count.toLocaleString()}</span>
                                ) : '-'}
                              </td>
                              <td className="py-2 px-2">
                                {r.winner_fid ? (
                                  <span className="text-yellow-400">🏆 {r.winner_username || `FID:${r.winner_fid}`}</span>
                                ) : '-'}
                              </td>
                              <td className="py-2 px-2">
                                {r.second_place_fid ? (
                                  <span className="text-gray-400">🥈 {r.second_place_username || `FID:${r.second_place_fid}`}</span>
                                ) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
