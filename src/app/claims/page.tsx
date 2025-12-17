"use client"

import React, { useMemo, useState } from "react"
import { useGame } from "@/context/GameContext"
import { useAuth } from "@/context/AuthContext"
import { getWalletAddress, sendTransaction } from "@/lib/ethereum-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

type RewardType = 'first' | 'second' | 'jackpot'

async function requestSignature(params: {
  roundId: string
  rewardType: RewardType
  recipient: string
  amount: string
  fid: string
}) {
  const res = await fetch('/api/rounds/sign-claim', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const j = await res.json().catch(() => ({}))
    throw new Error(j?.error || 'Claim signing failed')
  }
  return res.json()
}

export default function ClaimsPage() {
  const { rounds, guesses, prizeConfig } = useGame()
  const { user, walletAddress } = useAuth()
  const { toast } = useToast()
  const [busyId, setBusyId] = useState<string | null>(null)

  const finished = useMemo(() => rounds.filter(r => r.status === 'finished').sort((a, b) => (b.endTime || 0) - (a.endTime || 0)), [rounds])

  const computeWinners = (roundId: string, actualTx?: number) => {
    if (actualTx == null) return [] as { address: string; guess: number; submittedAt: number }[]
    return guesses
      .filter(g => g.roundId === roundId)
      .map(g => ({ address: g.address, guess: g.guess, submittedAt: g.submittedAt }))
      .sort((a, b) => {
        const da = Math.abs(a.guess - actualTx)
        const db = Math.abs(b.guess - actualTx)
        if (da !== db) return da - db
        return a.submittedAt - b.submittedAt
      })
  }

  const onClaim = async (roundId: string, type: RewardType) => {
    try {
      if (!user?.address?.startsWith('fid-')) throw new Error('Login with Farcaster required')
      setBusyId(`${roundId}:${type}`)
      
      // Get wallet address from auth context or request from provider
      const recipient = walletAddress || await getWalletAddress()
      const fid = user.address.slice(4)
      const amount = type === 'first' ? (prizeConfig?.firstPlaceAmount || '0') : type === 'second' ? (prizeConfig?.secondPlaceAmount || '0') : (prizeConfig?.jackpotAmount || '0')
      
      const data = await requestSignature({ roundId, rewardType: type, recipient, amount, fid })
      
      if (data?.tx?.to && data?.tx?.data) {
        toast({ title: 'Confirm in wallet', description: 'Please approve the transaction' })
        const txHash = await sendTransaction({
          to: data.tx.to,
          data: data.tx.data,
          value: '0x0'
        })
        toast({ title: 'Claim submitted', description: `Tx: ${txHash.slice(0, 10)}...` })
      } else {
        toast({ title: 'Signature ready', description: 'Complete onchain step from wallet' })
      }
    } catch (e: any) {
      if (!e?.message?.includes('rejected') && !e?.message?.includes('denied')) {
        toast({ title: 'Claim failed', description: e?.message || 'Error', variant: 'destructive' })
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="glass-card border-2 border-emerald-500/40">
        <CardHeader>
          <CardTitle className="text-white">Your Claimable Rounds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {finished.length === 0 && <div className="text-sm text-gray-300">No finished rounds yet.</div>}
          {finished.map(r => {
            const winners = computeWinners(r.id, r.actualTxCount)
            const first = winners[0]
            const second = winners[1]
            const you = user?.address
            const isFirst = you && first && you === first.address
            const isSecond = you && second && you === second.address
            const isJackpot = isFirst && first && r.actualTxCount != null && first.guess === r.actualTxCount
            return (
              <div key={r.id} className="p-3 rounded-md bg-black/30 border border-emerald-500/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-gray-200 text-sm">Round #{r.roundNumber} • Tx: {r.actualTxCount ?? '-'} </div>
                  <div className="text-xs text-gray-400">Ended: {new Date(r.endTime || 0).toLocaleString()}</div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Button disabled={!isFirst || busyId === `${r.id}:first`} onClick={() => onClaim(r.id, 'first')} className="bg-emerald-600 hover:bg-emerald-700">Claim First</Button>
                  <Button disabled={!isSecond || busyId === `${r.id}:second`} onClick={() => onClaim(r.id, 'second')} className="bg-violet-600 hover:bg-violet-700">Claim Second</Button>
                  <Button disabled={!isJackpot || busyId === `${r.id}:jackpot`} onClick={() => onClaim(r.id, 'jackpot')} className="bg-amber-600 hover:bg-amber-700">Claim Jackpot</Button>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
