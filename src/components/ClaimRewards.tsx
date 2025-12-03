"use client"

import { useMemo, useState } from "react"
import { useGame } from "@/context/GameContext"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ensureWalletSession } from "@/lib/wallet-session"
import { useAccount } from "wagmi"
import { calculateWinners } from "@/lib/winner-utils"

export function ClaimRewards() {
  const { rounds, prizeConfig, guesses } = useGame()
  const { user } = useAuth()
  const { address } = useAccount()
  const { toast } = useToast()
  const [_submittingFirst, setSubmittingFirst] = useState(false)
  const [_submittingSecond, setSubmittingSecond] = useState(false)
  const [_submittingJackpot, setSubmittingJackpot] = useState(false)

  const latestFinished = useMemo(() => {
    return [...rounds].filter(r => r.status === "finished").sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0] || null
  }, [rounds])

  const computedWinners = useMemo(() => {
    if (!latestFinished || latestFinished.actualTxCount == null) return [] as { address?: string; guess: bigint; submittedAt: bigint }[]
    const list = guesses
      .filter(g => g.roundId === latestFinished.id)
      .map(g => ({ address: g.address, guess: BigInt(g.guess), submittedAt: BigInt(g.submittedAt) }))
    return calculateWinners(list, BigInt(latestFinished.actualTxCount))
  }, [guesses, latestFinished])

  const firstWinner = computedWinners[0]
  const secondWinner = computedWinners[1]

  const isWinnerFirst = !!(user?.address && firstWinner && user.address === firstWinner.address)
  const isWinnerSecond = !!(user?.address && secondWinner && user.address === secondWinner.address)
  const isJackpot = !!(firstWinner && latestFinished?.actualTxCount != null && firstWinner.guess === BigInt(latestFinished.actualTxCount) && user?.address === firstWinner.address)

  const handleClaimFirst = async (): Promise<void> => {
    if (!latestFinished) return
    try {
      setSubmittingFirst(true)
      const walletAddr = await ensureWalletSession()
      const amount = prizeConfig ? prizeConfig.firstPlaceAmount : "0"
      // Derive FID from logged in user (AuthContext stores Farcaster id as address = 'fid-<num>')
      const fid = (user?.address && user.address.startsWith('fid-')) ? user.address.slice(4) : undefined
      if (!fid) throw new Error('Missing Farcaster identity (FID)')
      const res = await fetch("/api/rewards/sign-claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roundId: latestFinished.id,
          rewardType: "first",
          recipient: walletAddr,
          amount,
          fid,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Claim signing failed")
      }
      const data = await res.json()
      toast({ title: "Signature ready", description: "Proceeding to onchain claim..." })
      if (data?.tx?.to && data?.tx?.data) {
        const params = [{ to: data.tx.to as `0x${string}`, data: data.tx.data as `0x${string}`, value: data.tx.value || "0x0" }]
        // Defer sending to wallet UI
        const eth = (globalThis as any).ethereum
        if (!eth) throw new Error("No wallet provider")
        await eth.request({ method: "eth_sendTransaction", params })
        toast({ title: "Claim submitted", description: "Transaction sent" })
        return
      }
      toast({ title: "Received claim signature", description: "Complete onchain step from your wallet modal" })
    } catch (e: any) {
      toast({ title: "Claim failed", description: e?.message || "Error", variant: "destructive" })
    } finally {
      setSubmittingFirst(false)
    }
  }

  const handleClaimSecond = async (): Promise<void> => {
    if (!latestFinished) return
    try {
      setSubmittingSecond(true)
      const walletAddr = await ensureWalletSession()
      const amount = prizeConfig ? prizeConfig.secondPlaceAmount : "0"
      const fid = (user?.address && user.address.startsWith('fid-')) ? user.address.slice(4) : undefined
      if (!fid) throw new Error('Missing Farcaster identity (FID)')
      const res = await fetch("/api/rewards/sign-claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roundId: latestFinished.id,
          rewardType: "second",
          recipient: walletAddr,
          amount,
          fid,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Claim signing failed")
      }
      await res.json()
      toast({ title: "Signature ready", description: "Proceeding to onchain claim..." })
    } catch (e: any) {
      toast({ title: "Claim failed", description: e?.message || "Error", variant: "destructive" })
    } finally {
      setSubmittingSecond(false)
    }
  }

  const handleClaimJackpot = async (): Promise<void> => {
    if (!latestFinished) return
    try {
      setSubmittingJackpot(true)
      const walletAddr = await ensureWalletSession()
      const amount = prizeConfig ? prizeConfig.jackpotAmount : "0"
      const fid = (user?.address && user.address.startsWith('fid-')) ? user.address.slice(4) : undefined
      if (!fid) throw new Error('Missing Farcaster identity (FID)')
      const res = await fetch("/api/rewards/sign-claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          roundId: latestFinished.id,
          rewardType: "jackpot",
          recipient: walletAddr,
          amount,
          fid,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || "Claim signing failed")
      }
      await res.json()
      toast({ title: "Signature ready", description: "Proceeding to onchain claim..." })
    } catch (e: any) {
      toast({ title: "Claim failed", description: e?.message || "Error", variant: "destructive" })
    } finally {
      setSubmittingSecond(false)
    }
  }

  if (!latestFinished) return null

  const isLoading = _submittingFirst || _submittingSecond || _submittingJackpot

  return (
    <Card className="glass-card border-2 border-emerald-500/40">
      <CardHeader>
        <CardTitle className="text-white">Claim Rewards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm text-gray-300">Latest finished round: #{latestFinished.roundNumber}</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            disabled={!isWinnerFirst || isLoading}
            onClick={handleClaimFirst}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {_submittingFirst ? "Processing..." : `Claim 1st • ${prizeConfig ? Number(prizeConfig.firstPlaceAmount).toLocaleString() : ""} ${prizeConfig?.currencyType || ""}`}
          </Button>
          <Button disabled={!isWinnerSecond || isLoading} onClick={handleClaimSecond} className="bg-violet-600 hover:bg-violet-700">
            {_submittingSecond ? "Processing..." : "Claim 2nd"}
          </Button>
          <Button disabled={!isJackpot || isLoading} onClick={handleClaimJackpot} className="bg-amber-600 hover:bg-amber-700">
            {_submittingJackpot ? "Processing..." : "Claim Jackpot"}
          </Button>
        </div>
        {!isWinnerFirst && (
          <div className="text-xs text-gray-400">You are not the recorded winner for the latest round.</div>
        )}
        {!address && (
          <div className="text-xs text-gray-400">Connect a wallet to claim.</div>
        )}
      </CardContent>
    </Card>
  )
}
