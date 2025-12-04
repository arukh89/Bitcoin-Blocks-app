'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGame } from '@/context/GameContext'
import type { ChatMessage } from '@/types/game'
import { useAuth } from '@/context/AuthContext'
import { calculateWinners } from '@/lib/winner-utils'
import { validateRoundTiming } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
// Removed APP_CONFIG - using pure realtime mode

export function AdminPanel() {
  const { createRound, endRound, updateRoundResult, activeRound, rounds, getGuessesForRound, connected, client, prizeConfig, addChatMessage, getSetting, getInt, getBool } = useGame()
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState<boolean>(false)
  const [checkingBlock, setCheckingBlock] = useState<boolean>(false)
  const [blockAvailable, setBlockAvailable] = useState<boolean>(false)

  // Form states
  const [roundNumber, setRoundNumber] = useState<string>('')
  const [blockNumber, setBlockNumber] = useState<string>('')
  const [duration, setDuration] = useState<string>('10')
  const [jackpotAmount, setJackpotAmount] = useState<string>('')
  const [firstPrize, setFirstPrize] = useState<string>('')
  const [secondPrize, setSecondPrize] = useState<string>('')
  const [prizeCurrency, setPrizeCurrency] = useState<string>('$Seconds')

  // Load saved prize config on mount
  useEffect(() => {
    if (prizeConfig) {
      setJackpotAmount(String(prizeConfig.jackpotAmount))
      setFirstPrize(String(prizeConfig.firstPlaceAmount))
      setSecondPrize(String(prizeConfig.secondPlaceAmount))
      setPrizeCurrency(prizeConfig.currencyType || '$Seconds')
    } else {
      // Set defaults if no config exists
      setJackpotAmount('5000')
      setFirstPrize('1000')
      setSecondPrize('500')
      setPrizeCurrency(getSetting('default_currency', '$Seconds') || '$Seconds')
    }
  }, [prizeConfig, getSetting])

  // Only show to admin users (check already done in parent, but double-check for safety)
  if (!user?.isAdmin) {
    console.log('⚠️ AdminPanel: User is not admin', { user })
    return <></>
  }
  
  console.log('✅ AdminPanel rendered for admin:', { 
    user, 
    connected, 
    hasClient: !!client,
    activeRound 
  })

  const handleStartRound = async (): Promise<void> => {
    console.log('🚀 handleStartRound called', { 
      roundNumber, 
      blockNumber, 
      duration,
      connected,
      hasClient: !!client,
      loading,
      user 
    })
    
    if (!roundNumber) {
      toast({
        title: '⚠️ Missing Round Number',
        description: 'Please enter a round number',
        variant: 'destructive'
      })
      return
    }

    if (!blockNumber) {
      toast({
        title: '⚠️ Missing Block Number',
        description: 'Please enter a target block number',
        variant: 'destructive'
      })
      return
    }

    if (!duration) {
      toast({
        title: '⚠️ Missing Duration',
        description: 'Please enter round duration in minutes',
        variant: 'destructive'
      })
      return
    }

    const roundNum = parseInt(roundNumber)
    if (isNaN(roundNum) || roundNum <= 0) {
      toast({
        title: '⚠️ Invalid Round Number',
        description: 'Please enter a valid positive round number',
        variant: 'destructive'
      })
      return
    }

    const blockNum = parseInt(blockNumber)
    if (isNaN(blockNum) || blockNum <= 0) {
      toast({
        title: '⚠️ Invalid Block Number',
        description: 'Please enter a valid positive block number',
        variant: 'destructive'
      })
      return
    }

    const durationMin = parseInt(duration)
    if (isNaN(durationMin) || durationMin <= 0) {
      toast({
        title: '⚠️ Invalid Duration',
        description: 'Please enter a valid positive duration in minutes',
        variant: 'destructive'
      })
      return
    }

    const now = Date.now()
    const endTime = now + (durationMin * 60 * 1000)
    // Validate timing & overlapping with current rounds
    try {
      validateRoundTiming(now, endTime, rounds as any)
    } catch (e) {
      toast({
        title: '⚠️ Invalid Timing',
        description: e instanceof Error ? e.message : 'Invalid round timing',
        variant: 'destructive'
      })
      return
    }
    const prize = `${jackpotAmount} ${prizeCurrency}`

    try {
      setLoading(true)
      await createRound(roundNum, now, endTime, prize, blockNum, durationMin)
      
      // Announce to Global Chat using template
      const tpl = getSetting('announce_template_round_start', '🔔 Round #{round} Started! 💰 {jackpot} • 🧱 #{block} • ⏱ {duration}m') || '🔔 Round #{round} Started! 💰 {jackpot} • 🧱 #{block} • ⏱ {duration}m'
      const msg = tpl
        .replace('{round}', String(roundNum))
        .replace('{jackpot}', `${jackpotAmount} ${prizeCurrency}`)
        .replace('{block}', `#${blockNum}`)
        .replace('{duration}', String(durationMin))
      await handleAnnounce(msg)
      
      toast({
        title: '✅ Round Started',
        description: `Round #${roundNum} - Block #${blockNum} - ${durationMin} min`
      })
      
      setRoundNumber('')
      setBlockNumber('')
      setDuration('10')
      
      // Start polling mempool.space for target block
      if (blockNum) {
        pollForTargetBlock(blockNum)
      }
    } catch (error) {
      toast({
        title: '❌ Failed',
        description: error instanceof Error ? error.message : 'Failed to start round',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEndRound = async (): Promise<void> => {
    if (!activeRound) {
      toast({
        title: '⚠️ No Active Round',
        description: 'There is no round to end',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      const success = await endRound(activeRound.id)
      if (success) {
        toast({
          title: '✅ Round Ended',
          description: 'Submissions are now locked - round in wait state'
        })
      } else {
        toast({
          title: '❌ Error',
          description: 'Failed to end round',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Failed to end round',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePostResults = async (): Promise<void> => {
    // Find any round with status 'closed' (not just activeRound)
    const closedRound = rounds.find(r => r.status === 'closed')
    
    if (!closedRound) {
      toast({
        title: '⚠️ No Closed Round',
        description: 'End a round first before posting results',
        variant: 'destructive'
      })
      return
    }

    if (!closedRound.blockNumber) {
      toast({
        title: '⚠️ No Block Number',
        description: 'Round does not have a target block',
        variant: 'destructive'
      })
      return
    }

    // Check if there are predictions in this round
    const guesses = getGuessesForRound(closedRound.id)
    if (guesses.length === 0) {
      toast({
        title: '⚠️ No Predictions',
        description: `Round #${closedRound.roundNumber || closedRound.id} has no player predictions. Cannot calculate winners.`,
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      
      // Fetch from internal mempool API
      // Strategy: try recent blocks first; if not found, fall back to block-by-height
      let blockHash = ''
      let actualTxCount = 0

      // 1) Try recent blocks list
      try {
        const recentRes = await fetch('/api/mempool?action=recent-blocks')
        if (recentRes.ok) {
          const recentBlocks = await recentRes.json() as Array<{ height: number, hash: string }>
          const found = recentBlocks.find(b => b.height === closedRound.blockNumber)
          if (found) {
            blockHash = found.hash
            const txRes = await fetch(`/api/mempool?action=tx-count&blockHash=${blockHash}`)
            if (!txRes.ok) throw new Error('Failed to fetch transaction count')
            const { txCount } = await (txRes.json() as Promise<{ txCount: number }>)
            actualTxCount = txCount
          }
        }
      } catch (e) {
        // Non-fatal; we'll fall back below
      }

      // 2) Fallback: resolve by explicit block height
      if (!blockHash) {
        const byHeight = await fetch(`/api/mempool?action=block-by-height&height=${closedRound.blockNumber}`)
        if (!byHeight.ok) {
          throw new Error(`Block #${closedRound.blockNumber} not found yet. Try again later.`)
        }
        const data = await byHeight.json() as { blockHash: string, txCount?: number }
        blockHash = data.blockHash
        if (typeof data.txCount === 'number') {
          actualTxCount = data.txCount
        } else {
          const txRes = await fetch(`/api/mempool?action=tx-count&blockHash=${blockHash}`)
          if (!txRes.ok) throw new Error('Failed to fetch transaction count')
          const { txCount } = await (txRes.json() as Promise<{ txCount: number }>)
          actualTxCount = txCount
        }
      }

      // Find winners
      const guesses = getGuessesForRound(closedRound.id)
      if (guesses.length === 0) {
        throw new Error('No predictions in this round')
      }

      const sorted = calculateWinners(
        guesses.map(g => ({ address: g.address, username: g.username, guess: BigInt(g.guess), submittedAt: BigInt(g.submittedAt) })),
        BigInt(actualTxCount)
      )

      const winner = sorted[0]
      
      if (!winner || !winner.address || !winner.username) {
        throw new Error('No winner found - sorted results are empty or missing data')
      }

      await updateRoundResult(closedRound.id, actualTxCount, blockHash, winner.address)

      // Announce results using template
      const tpl = getSetting('announce_template_results', '📊 Block #{block} had {txCount} txs. 🥇 @{winner}') || '📊 Block #{block} had {txCount} txs. 🥇 @{winner}'
      const message = tpl
        .replace('{block}', `#${closedRound.blockNumber}`)
        .replace('{txCount}', actualTxCount.toLocaleString())
        .replace('{winner}', winner.username)
      await handleAnnounce(message)

      toast({
        title: '🎉 Results Posted!',
        description: `Winner: @${winner.username} - announced in Global Chat`
      })
    } catch (error) {
      toast({
        title: '❌ Failed',
        description: error instanceof Error ? error.message : 'Failed to post results',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAnnounce = async (message: string): Promise<void> => {
    if (!user?.isAdmin) {
      console.warn('⚠️ Non-admin tried to announce')
      return
    }

    try {
      // Gate by FID-only depending on setting (default true)
      const requiresFid = getBool('admin_announce_requires_fid', true)
      if (requiresFid && !user.address.startsWith('fid-')) return

      const chatMsg: ChatMessage = {
        id: `sys-${Date.now()}`,
        roundId: 'global',
        address: user.address,
        username: user.username,
        message,
        pfpUrl: user.pfpUrl,
        timestamp: Date.now(),
        type: 'system'
      }
      await addChatMessage(chatMsg)
    } catch (error) {
      console.error('Announcement error:', error)
    }
  }

  const handleSavePrizeConfig = async (): Promise<void> => {
    if (!client || !connected) {
      toast({
        title: '⚠️ Not Connected',
        description: 'Please wait for database connection',
        variant: 'destructive'
      })
      return
    }

    // Validate inputs
    const jackpotNum = parseFloat(jackpotAmount.replace(/,/g, ''))
    const firstNum = parseFloat(firstPrize.replace(/,/g, ''))
    const secondNum = parseFloat(secondPrize.replace(/,/g, ''))

    if (isNaN(jackpotNum) || jackpotNum <= 0) {
      toast({
        title: '⚠️ Invalid Jackpot Amount',
        description: 'Please enter a valid positive number',
        variant: 'destructive'
      })
      return
    }

    if (isNaN(firstNum) || firstNum <= 0) {
      toast({
        title: '⚠️ Invalid 1st Place Prize',
        description: 'Please enter a valid positive number',
        variant: 'destructive'
      })
      return
    }

    if (isNaN(secondNum) || secondNum <= 0) {
      toast({
        title: '⚠️ Invalid 2nd Place Prize',
        description: 'Please enter a valid positive number',
        variant: 'destructive'
      })
      return
    }

    if (!prizeCurrency || prizeCurrency.trim() === '') {
      toast({
        title: '⚠️ Missing Currency',
        description: 'Please enter a currency type',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      
      // Convert to BigInt for SpacetimeDB
      const reducers = (client as any).reducers as any
      await reducers.savePrizeConfig(
        BigInt(Math.floor(jackpotNum)),
        BigInt(Math.floor(firstNum)),
        BigInt(Math.floor(secondNum)),
        prizeCurrency.trim(),
        user?.address || ''
      )

      toast({
        title: '✅ Prize Config Saved',
        description: `Jackpot: ${jackpotAmount} ${prizeCurrency}, 1st: ${firstPrize}, 2nd: ${secondPrize} ${prizeCurrency}`
      })
    } catch (error) {
      toast({
        title: '❌ Failed to Save',
        description: error instanceof Error ? error.message : 'Failed to save prize config',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Poll mempool (via internal API) to check if target block is available
  const pollForTargetBlock = async (targetBlock: number): Promise<void> => {
    setCheckingBlock(true)
    setBlockAvailable(false)
    
    const checkBlock = async (): Promise<boolean> => {
      try {
        // Fast path: check recent blocks list
        const response = await fetch('/api/mempool?action=recent-blocks')
        if (response.ok) {
          const blocks = await response.json() as Array<{ height: number }>
          const exists = blocks.some(b => b.height === targetBlock)
          if (exists) {
            console.log(`✅ Block #${targetBlock} is now available (recent-blocks)!`)
            return true
          }
        }
        // Fallback: resolve by height explicitly
        const byHeight = await fetch(`/api/mempool?action=block-by-height&height=${targetBlock}`)
        if (byHeight.ok) {
          console.log(`✅ Block #${targetBlock} is now available (block-by-height)!`)
          return true
        }
        return false
      } catch (error) {
        console.log(`⏳ Block #${targetBlock} not yet available...`)
        return false
      }
    }
    
    // Poll interval from settings (seconds)
    const pollSec = Math.max(5, getInt('admin_poll_interval_seconds', 30))
    const interval = setInterval(async () => {
      if (!activeRound || activeRound.status !== 'open') {
        clearInterval(interval)
        setCheckingBlock(false)
        return
      }
      
      const available = await checkBlock()
      if (available) {
        setBlockAvailable(true)
        setCheckingBlock(false)
        clearInterval(interval)
        
        // Auto-close round
        if (activeRound && activeRound.status === 'open') {
          toast({
            title: '🎯 Target Block Found!',
            description: `Block #${targetBlock} is available. Auto-closing round...`,
          })
          
          setTimeout(async () => {
            try {
              await handleEndRound()
              toast({
                title: '✅ Round Auto-Closed',
                description: 'Round closed automatically. You can now post results.',
              })
            } catch (error) {
              console.error('Failed to auto-close round:', error)
            }
          }, 2000)
        }
      }
    }, pollSec * 1000)
    
    // Initial check
    const available = await checkBlock()
    if (available) {
      setBlockAvailable(true)
      setCheckingBlock(false)
      clearInterval(interval)
    }
  }

  return (
    <motion.div
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.9 }}
    >
      <Card className="glass-card-dark border-2 border-yellow-500/50 shadow-2xl shadow-yellow-500/20">
        <CardHeader className="pb-3 border-b border-yellow-500/30">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl"
              >
                🛠️
              </motion.span>
              <div>
                <div className="text-xl font-black gradient-text">Admin Panel</div>
                <div className="text-[10px] text-yellow-300 font-normal">Manage rounds & configure prizes</div>
              </div>
            </div>

          </CardTitle>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Grid Layout for Admin Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Start New Round */}
            <div className="glass-card p-6 rounded-2xl space-y-4 border border-green-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚀</span>
                <h3 className="text-base font-bold text-white">Start New Round</h3>
              </div>
              <p className="text-xs text-gray-400">Opens new round for guesses & auto-announces in Global Chat</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roundNumber" className="text-gray-300 text-sm font-bold">🔢 Round Number <span className="text-gray-500 font-normal text-xs">(sequential: 1, 2, 3...)</span></Label>
                  <Input
                    type="number"
                    id="roundNumber"
                    name="roundNumber"
                    placeholder="Enter: 1, 2, 3, 4, 5... (NOT block number!)"
                    value={roundNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoundNumber(e.target.value)}
                    disabled={loading || !connected}
                    className="bg-gray-800/50 border-gray-600/50 text-white h-12 placeholder:text-gray-500"
                  />
                  <p className="text-[10px] text-green-400">✅ Example: Round 1, Round 2, Round 3</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="blockNumber" className="text-gray-300 text-sm font-bold">🧱 Target Block Number <span className="text-gray-500 font-normal text-xs">(from mempool.space)</span></Label>
                  <Input
                    type="number"
                    id="blockNumber"
                    name="blockNumber"
                    placeholder="Enter: 919185, 875420... (Bitcoin block height)"
                    value={blockNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBlockNumber(e.target.value)}
                    disabled={loading || !connected}
                    className="bg-gray-800/50 border-gray-600/50 text-white h-12 placeholder:text-gray-500"
                  />
                  <p className="text-[10px] text-cyan-400">✅ Example: Block #919185 (6-digit number)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-gray-300 text-sm font-bold">⏱ Round Duration <span className="text-gray-500 font-normal text-xs">(in minutes)</span></Label>
                  <Input
                    type="number"
                    id="duration"
                    name="duration"
                    placeholder="e.g., 10, 15, 30 minutes"
                    value={duration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDuration(e.target.value)}
                    disabled={loading || !connected}
                    className="bg-gray-800/50 border-gray-600/50 text-white h-12 placeholder:text-gray-500"
                  />
                  <p className="text-[10px] text-orange-400">✅ Default: 10 minutes</p>
                </div>
              </div>

              <Button
                onClick={handleStartRound}
                disabled={loading || !connected}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⚙️ Starting...' : !connected ? '🔌 Connecting...' : '🔔 Start Round & Announce'}
              </Button>
              {/* Hint when announcements require FID but admin is not FID */}
              {getBool('admin_announce_requires_fid', true) && user && !user.address.startsWith('fid-') && (
                <p className="text-[10px] text-red-400 mt-2 text-center">
                  🔒 Announcements require Farcaster login (FID). Set <span className="font-mono">admin_announce_requires_fid = false</span> in Site Settings to allow wallet-only.
                </p>
              )}
              {!connected && (
                <p className="text-xs text-red-400 mt-2 text-center">
                  ⚠️ Waiting for database connection...
                </p>
              )}
            </div>

            {/* Manage Round - Combined End & Post Results */}
            <div className="glass-card p-6 rounded-2xl space-y-4 border border-purple-500/30">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎮</span>
                <h3 className="text-base font-bold text-white">Manage Round</h3>
              </div>
              <p className="text-xs text-gray-400">
                End round or fetch results from mempool.space (auto-closes when target block available)
              </p>

              {/* Round Status Info */}
              {activeRound ? (
                <div className="space-y-3">
                  <div className="glass-card-dark p-3 rounded-lg border border-gray-600/30">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Round #:</span>
                      <span className="text-orange-400 font-bold">{activeRound.roundNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-400">Target Block:</span>
                      <span className="text-cyan-400 font-bold">#{activeRound.blockNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-400">Total Guesses:</span>
                      <span className="text-green-400 font-bold">{getGuessesForRound(activeRound.id).length}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-400">Status:</span>
                      <span className={`font-bold ${
                        activeRound.status === 'open' ? 'text-green-400' :
                        activeRound.status === 'closed' ? 'text-yellow-400' :
                        'text-purple-400'
                      }`}>
                        {activeRound.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  {/* Block Check Status */}
                  {checkingBlock && (
                    <div className="glass-card-dark p-3 rounded-lg border border-blue-500/30">
                      <p className="text-xs text-blue-300 text-center">
                        🔍 Checking mempool.space for Block #{activeRound.blockNumber}...
                      </p>
                    </div>
                  )}
                  
                  {blockAvailable && (
                    <div className="glass-card-dark p-3 rounded-lg border border-green-500/30">
                      <p className="text-xs text-green-300 text-center">
                        ✅ Block #{activeRound.blockNumber} found on mempool.space!
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="glass-card-dark p-3 rounded-lg border border-gray-600/30">
                  <p className="text-xs text-gray-400 text-center py-2">
                    ⚠️ No active round
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                {/* End Round Button */}
                <Button
                  onClick={handleEndRound}
                  variant="destructive"
                  disabled={loading || !connected || !activeRound || activeRound.status !== 'open'}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 font-bold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⚙️' : '🔒'}
                  <span className="ml-1 text-xs">
                    {loading ? 'Ending...' : 'End Round'}
                  </span>
                </Button>

                {/* Post Results Button */}
                <Button
                  onClick={handlePostResults}
                  disabled={loading || !connected || !rounds.find(r => r.status === 'closed')}
                  className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-bold h-12 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? '⚙️' : '📡'}
                  <span className="ml-1 text-xs">
                    {loading ? 'Fetching...' : 'Post Results'}
                  </span>
                </Button>
              </div>
              
              {/* Helper Text */}
              <div className="text-[10px] text-gray-500 text-center">
                {!activeRound && !rounds.find(r => r.status === 'closed')
                  ? 'Create a round first' 
                  : activeRound?.status === 'open' 
                  ? 'End round to enable posting results' 
                  : rounds.find(r => r.status === 'closed')
                  ? 'Ready to post results'
                  : 'Results already posted'
                }
              </div>
            </div>

            {/* Set Prizes / Currency */}
            <div className="glass-card p-6 rounded-2xl space-y-4 border border-blue-500/30 lg:col-span-2">
              <div className="flex items-center gap-2">
                <span className="text-xl">💰</span>
                <h3 className="text-base font-bold text-white">Set Prizes / Currency</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="jackpotAmount" className="text-gray-300 text-sm">Jackpot Amount</Label>
                    <Input
                      type="text"
                      id="jackpotAmount"
                      name="jackpotAmount"
                      placeholder="5000 (enter numbers only)"
                      value={jackpotAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setJackpotAmount(e.target.value)}
                      className="bg-gray-800/50 border-gray-600/50 text-white"
                    />
                    <p className="text-[10px] text-gray-400">Enter amount without commas or currency symbols</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstPrize" className="text-gray-300 text-sm">1st Place Prize</Label>
                    <Input
                      type="text"
                      id="firstPrize"
                      name="firstPrize"
                      placeholder="1000"
                      value={firstPrize}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstPrize(e.target.value)}
                      className="bg-gray-800/50 border-gray-600/50 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondPrize" className="text-gray-300 text-sm">2nd Place Prize</Label>
                    <Input
                      type="text"
                      id="secondPrize"
                      name="secondPrize"
                      placeholder="500"
                      value={secondPrize}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSecondPrize(e.target.value)}
                      className="bg-gray-800/50 border-gray-600/50 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="prizeCurrency" className="text-gray-300 text-sm">Prize Currency</Label>
                <Input
                  type="text"
                  id="prizeCurrency"
                  name="prizeCurrency"
                  placeholder="$Seconds"
                  value={prizeCurrency}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrizeCurrency(e.target.value)}
                  className="bg-gray-800/50 border-gray-600/50 text-white"
                />
              </div>

              {/* Save Prize Config Button */}
              <Button
                onClick={handleSavePrizeConfig}
                disabled={loading || !connected}
                className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-bold h-12"
              >
                {loading ? '⚙️ Saving...' : '💾 Save Prize Configuration'}
              </Button>

              <div className="glass-card-dark p-3 rounded-lg border border-blue-500/30">
                <p className="text-xs text-blue-300">
                  💡 Save your prize configuration to database. These values will be used when creating new rounds.
                </p>
              </div>
            </div>
          </div>

          {/* Info Note */}
          <div className="glass-card-dark p-4 rounded-xl border border-cyan-500/30">
            <p className="text-sm text-cyan-300">
              <span className="font-bold">ℹ️ Auto-Announcement:</span> Starting rounds and posting results will automatically announce in Global Chat with formatted messages.
            </p>
          </div>

          
        </CardContent>
      </Card>
    </motion.div>
  )
}
