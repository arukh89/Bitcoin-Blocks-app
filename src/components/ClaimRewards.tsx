"use client"

import { useMemo, useState } from "react"
import { useGame } from "@/context/GameContext"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ensureWalletSession } from "@/lib/wallet-session"
import { useAccount } from "wagmi"

export function ClaimRewards() {
  const { rounds, prizeConfig, guesses } = useGame()
  const { user } = useAuth()
  const { address } = useAccount()
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const latestFinished = useMemo(() => {
    return [...rounds].filter(r => r.status === "finished").sort((a, b) => (b.endTime || 0) - (a.endTime || 0))[0] || null
  }, [rounds])

  const computedWinners = useMemo(() => {
    if (!latestFinished || latestFinished.actualTxCount == null) return [] as { address: string; guess: number; submittedAt: number }[]
    const list = guesses
      .filter(g => g.roundId === latestFinished.id)
      .map(g => ({ address: g.address, guess: g.guess, submittedAt: g.submittedAt }))
      .sort((a, b) => {
        const da = Math.abs(a.guess - (latestFinished.actualTxCount as number))
        const db = Math.abs(b.guess - (latestFinished.actualTxCount as number))
        if (da !== db) return da - db
        return a.submittedAt - b.submittedAt
      })
    return list
  }, [guesses, latestFinished])

  const firstWinner = computedWinners[0]
  const secondWinner = computedWinners[1]

  const isWinnerFirst = !!(user?.address && firstWinner && user.address === firstWinner.address)
  const isWinnerSecond = !!(user?.address && secondWinner && user.address === secondWinner.address)
  const isJackpot = !!(firstWinner && latestFinished?.actualTxCount != null && firstWinner.guess === latestFinished.actualTxCount && user?.address === firstWinner.address)

  const handleClaimFirst = async (): Promise<void> => {
    if (!latestFinished) return
    try {
      setSubmitting(true)
      const walletAddr = await ensureWalletSession()
      const amount = prizeConfig ? prizeConfig.firstPlaceAmount : "0"
      // Derive FID from logged in user (AuthContext stores Farcaster id as address = 'fid-<num>')
      const fid = (user?.address && user.address.startsWith('fid-')) ? user.address.slice(4) : undefined
      if (!fid) throw new Error('Missing Farcaster identity (FID)')
      const res = await fetch("/api/rounds/sign-claim", {
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
      setSubmitting(false)
    }
  }

  const handleClaimSecond = async (): Promise<void> => {
    if (!latestFinished) return
    try {
      setSubmitting(true)
      const walletAddr = await ensureWalletSession()
      const amount = prizeConfig ? prizeConfig.secondPlaceAmount : "0"
      const fid = (user?.address && user.address.startsWith('fid-')) ? user.address.slice(4) : undefined
      if (!fid) throw new Error('Missing Farcaster identity (FID)')
      const res = await fetch("/api/rounds/sign-claim", {
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
      const data = await res.json()
      toast({ title: "Signature ready", description: "Proceeding to onchain claim..." })
      if (data?.tx?.to && data?.tx?.data) {
        const params = [{ to: data.tx.to as `0x${string}`, data: data.tx.data as `0x${string}`, value: data.tx.value || "0x0" }]
        const eth = (globalThis as any).ethereum
        if (!eth) throw new Error("No wallet provider")
        await eth.request({ method: "eth_sendTransaction", params })
        toast({ title: "Claim submitted", description: "Transaction sent" })
      }
    } catch (e: any) {
      toast({ title: "Claim failed", description: e?.message || "Error", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  const handleClaimJackpot = async (): Promise<void> => {
    if (!latestFinished) return
    try {
      setSubmitting(true)
      const walletAddr = await ensureWalletSession()
      const amount = prizeConfig ? prizeConfig.jackpotAmount : "0"
      const fid = (user?.address && user.address.startsWith('fid-')) ? user.address.slice(4) : undefined
      if (!fid) throw new Error('Missing Farcaster identity (FID)')
      const res = await fetch("/api/rounds/sign-claim", {
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
      const data = await res.json()
      toast({ title: "Signature ready", description: "Proceeding to onchain claim..." })
      if (data?.tx?.to && data?.tx?.data) {
        const params = [{ to: data.tx.to as `0x${string}`, data: data.tx.data as `0x${string}`, value: data.tx.value || "0x0" }]
        const eth = (globalThis as any).ethereum
        if (!eth) throw new Error("No wallet provider")
        await eth.request({ method: "eth_sendTransaction", params })
        toast({ title: "Claim submitted", description: "Transaction sent" })
      }
    } catch (e: any) {
      toast({ title: "Claim failed", description: e?.message || "Error", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
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
            onClick={handleClaimFirst}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {submitting ? "Processing..." : `Claim 1st • ${prizeConfig ? Number(prizeConfig.firstPlaceAmount).toLocaleString() : ""} ${prizeConfig?.currencyType || ""}`}
          </Button>
          <Button disabled={!isWinnerSecond || submitting} onClick={handleClaimSecond} className="bg-violet-600 hover:bg-violet-700">Claim 2nd</Button>
          <Button disabled={!isJackpot || submitting} onClick={handleClaimJackpot} className="bg-amber-600 hover:bg-amber-700">Claim Jackpot</Button>
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
