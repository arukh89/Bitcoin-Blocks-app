import { NextResponse, type NextRequest } from 'next/server'
import { isAddress } from 'viem'
import { createServerSupabase, getRewardSignerConfig } from '@/lib/supabase-server'
import { signRewardClaim, generateNonce, generateExpiry } from '@/lib/reward-signer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  roundId: string
  rewardType: 'first' | 'second' | 'jackpot'
  recipient: string
  amount: string
  fid?: string | number
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { roundId, rewardType, recipient, amount, fid } = (await req.json()) as Body
    if (!roundId || !rewardType || !recipient || !amount) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }
    if (!isAddress(recipient)) {
      return NextResponse.json({ ok: false, error: 'Invalid address' }, { status: 400 })
    }

    // Get signer configuration
    const signerConfig = getRewardSignerConfig()
    if (!signerConfig) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 })
    }
    const { contractAddress, tokenAddress, privateKey, chainId } = signerConfig

    const fidNum = fid !== undefined && fid !== null ? Number(fid) : 0
    if (fidNum === 0) {
      return NextResponse.json({ ok: false, error: 'Missing fid' }, { status: 400 })
    }

    // SECURITY: Always validate eligibility - no bypass allowed
    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
    }
    const roundIdNum = Number(roundId)

    // Check if this claim was already processed (prevent double claims)
    const claimKey = `${roundId}-${fidNum}-${rewardType}`
    const { data: existingClaim } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('round_id', roundIdNum)
      .eq('user_identifier', `fid-${fidNum}`)
      .eq('claim_type', rewardType)
      .single()

    if (existingClaim) {
      return NextResponse.json({ ok: false, error: 'Reward already claimed' }, { status: 409 })
    }

    {

      const { data: roundRow, error: roundError } = await supabase
        .from('rounds')
        .select('*')
        .eq('id', roundIdNum)
        .single()

      if (roundError || !roundRow) {
        return NextResponse.json({ ok: false, error: 'Round not found' }, { status: 404 })
      }

      const actualTx = roundRow.actual_tx_count
      const winningFid = roundRow.winning_fid

      if (rewardType === 'first') {
        if (!winningFid || winningFid !== fidNum) {
          return NextResponse.json({ ok: false, error: 'Not authorized: not first-place winner' }, { status: 403 })
        }
      } else {
        const { data: guesses } = await supabase
          .from('guesses')
          .select('*')
          .eq('round_id', roundIdNum)

        if (!actualTx || !guesses || guesses.length === 0) {
          return NextResponse.json({ ok: false, error: 'Round results not available' }, { status: 409 })
        }

        const sorted = guesses.sort((a, b) => {
          const da = Math.abs(a.guess - actualTx)
          const db = Math.abs(b.guess - actualTx)
          if (da !== db) return da - db
          const timeA = a.submitted_at ? new Date(a.submitted_at).getTime() : 0
          const timeB = b.submitted_at ? new Date(b.submitted_at).getTime() : 0
          return timeA - timeB
        })

        const first = sorted[0]
        const second = sorted[1]

        if (rewardType === 'second') {
          if (!second || second.fid !== fidNum) {
            return NextResponse.json({ ok: false, error: 'Not authorized: not second-place winner' }, { status: 403 })
          }
        } else if (rewardType === 'jackpot') {
          if (!first || first.fid !== fidNum || first.guess !== actualTx) {
            return NextResponse.json({ ok: false, error: 'Not authorized: not jackpot winner' }, { status: 403 })
          }
        }
      }
    }

    // Record the claim attempt to prevent double claims
    await supabase.from('reward_claims').insert({
      round_id: roundIdNum,
      user_identifier: `fid-${fidNum}`,
      claim_type: rewardType,
      amount: Number(amount),
      token_address: tokenAddress,
      status: 'pending'
    })

    // Sign the claim using shared utility
    const prizeType: number = rewardType === 'first' ? 1 : rewardType === 'second' ? 2 : 3
    const message = {
      roundId: BigInt(roundId),
      fid: BigInt(fidNum),
      recipient: recipient as `0x${string}`,
      amount: BigInt(amount),
      prizeType,
      nonce: generateNonce(),
      expiry: generateExpiry(),
    }

    const signedClaim = await signRewardClaim(message, contractAddress, chainId, privateKey)

    return NextResponse.json({ ok: true, ...signedClaim })
  } catch (e) {
    console.error('rounds sign-claim error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
