"use client"

import { useMemo, useState, useEffect } from "react"
import { useGame } from "@/context/GameContext"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { getWalletAddress, sendTransaction } from "@/lib/ethereum-provider"

// Loading skeleton component
function ClaimSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-4 bg-gray-700 rounded w-1/3"></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="h-10 bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
        <div className="h-10 bg-gray-700 rounded"></div>
      </div>
    </div>
  )
}

export function ClaimRewards() {
  const { rounds, prizeConfig, guesses, connected } = useGame()
  const { user, walletAddress } = useAuth()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [claimingType, setClaimingType] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Simulate initial loading state
  useEffect(() => {
    if (connected && rounds.length >= 0) {
      setIsLoading(false)
    }
  }, [connected, rounds])

  const latestFinished = useMemo(() => {
    return [...rounds].filter(r => r.status === "finished").sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0] || null
  }, [rounds])

  const computedWinners = useMemo(() => {
    if (!latestFinished || latestFinished.actualTxCount == null) return []
    return guesses
      .filter(g => g.roundId === latestFinished.id)
      .map(g => ({ address: g.address, guess: g.guess, submittedAt: g.submittedAt }))
      .sort((a, b) => {
        const da = Math.abs(a.guess - (latestFinished.actualTxCount as number))
        const db = Math.abs(b.guess - (latestFinished.actualTxCount as number))
        if (da !== db) return da - db
        return a.submittedAt - b.submittedAt
      })
  }, [guesses, latestFinished])

  const firstWinner = computedWinners[0]
  const secondWinner = computedWinners[1]

  const isWinnerFirst = !!(user?.address && firstWinner && user.address === firstWinner.address)
  const isWinnerSecond = !!(user?.address && secondWinner && user.address === secondWinner.address)
  const isJackpot = !!(firstWinner && latestFinished?.actualTxCount != null && firstWinner.guess === latestFinished.actualTxCount && user?.address === firstWinner.address)

  const handleClaim = async (rewardType: 'first' | 'second' | 'jackpot'): Promise<void> => {
    if (!latestFinished || !user) return
    
    try {
      setSubmitting(true)
      setClaimingType(rewardType)
      
      // Get wallet address
      const recipient = walletAddress || await getWalletAddress()
      
      // Get FID
      const fid = user.address.startsWith('fid-') ? user.address.slice(4) : undefined
      if (!fid) throw new Error('Farcaster identity required')
      
      // Get amount based on reward type
      const amount = rewardType === 'first' 
        ? prizeConfig?.firstPlaceAmount 
        : rewardType === 'second' 
          ? prizeConfig?.secondPlaceAmount 
          : prizeConfig?.jackpotAmount
      
      // Request signature from server
      const res = await fetch("/api/rounds/sign-claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roundId: latestFinished.id,
          rewardType,
          recipient,
          amount: amount || "0",
          fid,
        }),
      })
      
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Claim signing failed")
      }
      
      const data = await res.json()
      
      if (data?.tx?.to && data?.tx?.data) {
        toast({ title: "Confirm in wallet", description: "Please approve the transaction" })
        
        const txHash = await sendTransaction({
          to: data.tx.to,
          data: data.tx.data,
          value: data.tx.value || "0x0"
        })
        
        toast({ title: "Claim submitted!", description: `Tx: ${txHash.slice(0, 10)}...` })
      }
    } catch (e: any) {
      console.error('Claim error:', e)
      if (!e?.message?.includes('rejected') && !e?.message?.includes('denied')) {
        toast({ title: "Claim failed", description: e?.message || "Error", variant: "destructive" })
      }
    } finally {
      setSubmitting(false)
      setClaimingType(null)
    }
  }

  // Show loading skeleton while data is loading
  if (isLoading) {
    return (
      <Card className="glass-card border-2 border-emerald-500/40">
        <CardHeader>
          <CardTitle className="text-white">Claim Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <ClaimSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (!latestFinished) return null

  return (
    <Card className="glass-card border-2 border-emerald-500/40">
      <CardHeader>
        <CardTitle className="text-white">Claim Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-300">Latest finished round: #{latestFinished.roundNumber}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            disabled={!isWinnerFirst || submitting}
            onClick={() => handleClaim('first')}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
          >
            {claimingType === 'first' ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span> Processing...
              </span>
            ) : (
              `Claim 1st • ${prizeConfig ? Number(prizeConfig.firstPlaceAmount).toLocaleString() : ""} ${prizeConfig?.currencyType || ""}`
            )}
          </Button>
          <Button 
            disabled={!isWinnerSecond || submitting} 
            onClick={() => handleClaim('second')} 
            className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50"
          >
            {claimingType === 'second' ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span> Processing...
              </span>
            ) : (
              `Claim 2nd • ${prizeConfig ? Number(prizeConfig.secondPlaceAmount).toLocaleString() : ""} ${prizeConfig?.currencyType || ""}`
            )}
          </Button>
          <Button 
            disabled={!isJackpot || submitting} 
            onClick={() => handleClaim('jackpot')} 
            className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
          >
            {claimingType === 'jackpot' ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⚙️</span> Processing...
              </span>
            ) : (
              `Claim Jackpot • ${prizeConfig ? Number(prizeConfig.jackpotAmount).toLocaleString() : ""} ${prizeConfig?.currencyType || ""}`
            )}
          </Button>
        </div>
        {!isWinnerFirst && !isWinnerSecond && (
          <div className="text-xs text-gray-400">You are not a winner for this round.</div>
        )}
      </CardContent>
    </Card>
  )
}
