'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '@/context/GameContext';
import { isAdminFid } from '@/config/app-config';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';

export function AdminDropdown() {
  const { user } = useFarcasterUser();
  const {
    activeRound,
    allRounds,
    prizeConfig,
    createRound,
    closeRound,
    updateRoundResult,
    updatePrizeConfig,
  } = useGame();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'round' | 'result' | 'prize'>('round');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [roundNumber, setRoundNumber] = useState('1');
  const [duration, setDuration] = useState('10');
  const [prize, setPrize] = useState('5,000 $SECOND');
  const [blockNumber, setBlockNumber] = useState('');
  const [actualTxCount, setActualTxCount] = useState('');
  const [blockHash, setBlockHash] = useState('');
  const [jackpot, setJackpot] = useState('5000');
  const [firstPlace, setFirstPlace] = useState('1000');
  const [secondPlace, setSecondPlace] = useState('500');
  const [currency, setCurrency] = useState('$SECOND');

  const isAdmin = isAdminFid(user?.fid);

  useEffect(() => {
    if (allRounds.length > 0) {
      const maxRound = Math.max(...allRounds.map((r) => r.round_number));
      setRoundNumber(String(maxRound + 1));
    }
  }, [allRounds]);

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
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await createRound(parseInt(roundNumber), parseInt(duration), prize, blockNumber ? parseInt(blockNumber) : undefined);
    showMsg(error ? 'error' : 'success', error ? String(error) : `Round #${roundNumber} created!`);
    if (!error) setRoundNumber(String(parseInt(roundNumber) + 1));
    setIsSubmitting(false);
  };

  const handleCloseRound = async () => {
    if (!activeRound) return;
    setIsSubmitting(true);
    const { error } = await closeRound(activeRound.id);
    showMsg(error ? 'error' : 'success', error ? String(error) : 'Round closed!');
    setIsSubmitting(false);
  };

  const handleFetchBlock = async () => {
    if (!blockNumber) return showMsg('error', 'Enter block number');
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/mempool?block=${blockNumber}`);
      const data = await res.json();
      if (data.error) showMsg('error', data.error);
      else {
        setActualTxCount(String(data.tx_count));
        setBlockHash(data.hash);
        showMsg('success', `${data.tx_count} txs`);
      }
    } catch (e: any) { showMsg('error', e.message); }
    setIsSubmitting(false);
  };

  const handleUpdateResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRound) return;
    setIsSubmitting(true);
    const { error } = await updateRoundResult(activeRound.id, parseInt(actualTxCount), blockHash);
    showMsg(error ? 'error' : 'success', error ? String(error) : 'Winner determined!');
    if (!error) { setActualTxCount(''); setBlockHash(''); }
    setIsSubmitting(false);
  };

  const handleSavePrize = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error } = await updatePrizeConfig({ jackpot: parseInt(jackpot), first_place: parseInt(firstPlace), second_place: parseInt(secondPlace), currency });
    showMsg(error ? 'error' : 'success', error ? String(error) : 'Saved!');
    setIsSubmitting(false);
  };

  return (
    <div className="relative">
      <motion.button whileTap={{ scale: 0.98 }} onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/30 rounded-lg hover:bg-purple-500/30">
        👑 Admin <span className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute right-0 top-full mt-2 w-80 z-50 glass-card p-4 border border-purple-500/30">
            {message && <div className={`p-2 rounded mb-3 text-xs ${message.type === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{message.text}</div>}
            
            <div className="flex gap-1 mb-3">
              {(['round', 'result', 'prize'] as const).map((t) => (
                <button key={t} onClick={() => setActiveTab(t)} className={`flex-1 py-1 text-xs rounded ${activeTab === t ? 'bg-purple-500' : 'bg-white/10'}`}>
                  {t === 'round' ? '🎮' : t === 'result' ? '🏆' : '💰'}
                </button>
              ))}
            </div>

            {activeTab === 'round' && (
              <form onSubmit={handleCreateRound} className="space-y-2">
                <input type="number" value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)} placeholder="Round #" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" required />
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="Duration (min)" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" required />
                <input type="text" value={prize} onChange={(e) => setPrize(e.target.value)} placeholder="Prize" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" required />
                <input type="number" value={blockNumber} onChange={(e) => setBlockNumber(e.target.value)} placeholder="Block # (optional)" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" />
                <button type="submit" disabled={isSubmitting || activeRound?.status === 'open'} className="w-full py-2 bg-green-500 rounded text-sm font-medium disabled:opacity-50">🚀 Create</button>
                {activeRound?.status === 'open' && <button type="button" onClick={handleCloseRound} disabled={isSubmitting} className="w-full py-2 bg-yellow-500 rounded text-sm font-medium disabled:opacity-50">⏰ Close Round</button>}
              </form>
            )}

            {activeTab === 'result' && (
              <form onSubmit={handleUpdateResult} className="space-y-2">
                {activeRound?.status === 'closed' ? (
                  <>
                    <input type="number" value={actualTxCount} onChange={(e) => setActualTxCount(e.target.value)} placeholder="Actual TX Count" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" required />
                    <input type="text" value={blockHash} onChange={(e) => setBlockHash(e.target.value)} placeholder="Block Hash" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" required />
                    <button type="button" onClick={handleFetchBlock} disabled={isSubmitting || !blockNumber} className="w-full py-1 bg-blue-500/30 rounded text-xs disabled:opacity-50">🔍 Fetch Block #{blockNumber || '?'}</button>
                    <button type="submit" disabled={isSubmitting || !actualTxCount} className="w-full py-2 bg-purple-500 rounded text-sm font-medium disabled:opacity-50">🏆 Determine Winner</button>
                  </>
                ) : <p className="text-xs text-gray-400 text-center py-4">{activeRound?.status === 'open' ? 'Close round first' : 'No round to update'}</p>}
              </form>
            )}

            {activeTab === 'prize' && (
              <form onSubmit={handleSavePrize} className="space-y-2">
                <input type="number" value={jackpot} onChange={(e) => setJackpot(e.target.value)} placeholder="Jackpot" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" />
                <input type="number" value={firstPlace} onChange={(e) => setFirstPlace(e.target.value)} placeholder="1st Place" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" />
                <input type="number" value={secondPlace} onChange={(e) => setSecondPlace(e.target.value)} placeholder="2nd Place" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" />
                <input type="text" value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="Currency" className="w-full px-2 py-1 text-sm bg-black/30 rounded border border-white/10" />
                <button type="submit" disabled={isSubmitting} className="w-full py-2 bg-yellow-500 rounded text-sm font-medium disabled:opacity-50">💾 Save</button>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
