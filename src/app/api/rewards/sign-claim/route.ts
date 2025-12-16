import { NextResponse, type NextRequest } from 'next/server'
import { isAddress, encodeFunctionData, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RewardClaimerAbi } from '@/lib/abis/rewardClaimer'
import { createClient } from '@supabase/supabase-js'

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

    const contractAddress = process.env.REWARD_CLAIMER_ADDRESS
    const tokenAddress = process.env.REWARD_TOKEN_ADDRESS
    const pk = process.env.REWARD_SIGNER_PRIVATE_KEY
    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453)

    if (!contractAddress || !tokenAddress || !chainId) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 })
    }

    if (!pk) {
      return NextResponse.json({ ok: false, error: 'Signer not configured' }, { status: 501 })
    }

    const devNoDb = (process.env.DEV_NO_DB || '').toLowerCase() === '1' || (process.env.DEV_NO_DB || '').toLowerCase() === 'true'
    const allowBypass = devNoDb && process.env.NODE_ENV !== 'production'

    const fidNum = fid !== undefined && fid !== null ? Number(fid) : 0
    if (fidNum === 0) {
      return NextResponse.json({ ok: false, error: 'Missing fid' }, { status: 400 })
    }

    if (!allowBypass) {
      // Validate against Supabase
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      const roundIdNum = Number(roundId)

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
          return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime()
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

    const prizeType: number = rewardType === 'first' ? 1 : rewardType === 'second' ? 2 : 3
    const amountBn = BigInt(amount)
    const roundIdBn = BigInt(roundId)
    const fidBn = BigInt(fidNum)

    const now = Math.floor(Date.now() / 1000)
    const expiry = BigInt(now + 60 * 60)
    const nonce = BigInt(BigInt(Date.now()) ^ BigInt(Math.floor(Math.random() * 1e9)))

    const domain = {
      name: 'RewardClaimer',
      version: '1',
      chainId,
      verifyingContract: contractAddress as `0x${string}`,
    }

    const types = {
      Claim: [
        { name: 'roundId', type: 'uint256' },
        { name: 'fid', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'prizeType', type: 'uint8' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
      ],
    } as const

    const message = {
      roundId: roundIdBn,
      fid: fidBn,
      recipient: recipient as `0x${string}`,
      amount: amountBn,
      prizeType,
      nonce,
      expiry,
    }

    const account = privateKeyToAccount(pk as Hex)
    const signature = await account.signTypedData({
      domain,
      types,
      primaryType: 'Claim',
      message,
    })

    const data = encodeFunctionData({
      abi: RewardClaimerAbi,
      functionName: 'claim',
      args: [
        message.roundId,
        message.fid,
        message.recipient,
        message.amount,
        message.prizeType,
        message.nonce,
        message.expiry,
        signature as Hex,
      ],
    })

    const claimJson = {
      roundId: message.roundId.toString(),
      fid: message.fid.toString(),
      recipient: message.recipient,
      amount: message.amount.toString(),
      prizeType: message.prizeType,
      nonce: message.nonce.toString(),
      expiry: message.expiry.toString(),
    }

    return NextResponse.json({ ok: true, signature, claim: claimJson, domain, tx: { to: contractAddress, data, chainId } })
  } catch (e) {
    console.error('sign-claim error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
