import { NextResponse, type NextRequest } from 'next/server'
import { isAddress, encodeFunctionData, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RewardClaimerAbi } from '@/lib/abis/rewardClaimer'
import { DbConnection } from '@/spacetime_module_bindings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  roundId: string
  rewardType: 'first' | 'second' | 'jackpot'
  recipient: string
  amount: string // expected in smallest units
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

    const isSecond = rewardType === 'second'
    const contractAddress = isSecond ? process.env.REWARD_CLAIMER_SECOND_ADDRESS : process.env.REWARD_CLAIMER_ADDRESS
    const tokenAddress = isSecond ? process.env.REWARD_TOKEN_SECOND_ADDRESS : process.env.REWARD_TOKEN_ADDRESS
    const pk = process.env.REWARD_SIGNER_PRIVATE_KEY
    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453)

    if (!contractAddress || !tokenAddress || !chainId) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 })
    }
    if (!pk) {
      return NextResponse.json({ ok: false, error: 'Signer not configured' }, { status: 501 })
    }

    // Parse and require FID
    const fidBn = fid !== undefined && fid !== null ? BigInt(typeof fid === 'string' ? fid : String(fid)) : 0n
    if (fidBn === 0n) {
      return NextResponse.json({ ok: false, error: 'Missing fid' }, { status: 400 })
    }

    // Dev bypass: allow skipping DB validation for local manual testing
    const devNoDb = (process.env.DEV_NO_DB || '').toLowerCase() === '1' || (process.env.DEV_NO_DB || '').toLowerCase() === 'true'
    const allowBypass = devNoDb && process.env.NODE_ENV !== 'production'

    if (!allowBypass) {
      // Validate against SpacetimeDB
    const HOST = process.env.NEXT_PUBLIC_SPACETIME_HOST || ''
    const DB_NAME = process.env.NEXT_PUBLIC_SPACETIME_DB_NAME || ''
    if (!HOST || !DB_NAME) {
      return NextResponse.json({ ok: false, error: 'SpacetimeDB not configured' }, { status: 500 })
    }
    const wsHost = (() => {
      let h = HOST.trim()
      if (h.startsWith('http://')) h = 'ws://' + h.slice('http://'.length)
      if (h.startsWith('https://')) h = 'wss://' + h.slice('https://'.length)
      if (!h.startsWith('ws://') && !h.startsWith('wss://')) h = 'wss://' + h.replace(/^\/+/, '')
      return h
    })()

    const conn = await DbConnection.builder().withUri(wsHost).withModuleName(DB_NAME).build()
    try { conn.subscriptionBuilder().subscribeToAllTables() } catch {}
    await new Promise(r => setTimeout(r, 250))

    const roundIdBn = BigInt(roundId)
    const roundsIter = Array.from(conn.db.rounds.iter()) as any[]
    const guessesIter = Array.from(conn.db.guesses.iter()) as any[]
    const roundRow = roundsIter.find((r: any) => r.roundId === roundIdBn)
    if (!roundRow) {
      return NextResponse.json({ ok: false, error: 'Round not found' }, { status: 404 })
    }

    const actualTx = roundRow.actualTxCount ?? undefined
    const winningFid = roundRow.winningFid ?? undefined

    if (rewardType === 'first') {
      if (!winningFid || winningFid !== fidBn) {
        return NextResponse.json({ ok: false, error: 'Not authorized: not first-place winner' }, { status: 403 })
      }
    } else {
      const roundGuesses = guessesIter
        .filter((g: any) => g.roundId === roundIdBn)
        .map((g: any) => ({ fid: g.fid as bigint, guess: g.guess as bigint, submittedAt: g.submittedAt as bigint }))
      if (!actualTx || roundGuesses.length === 0) {
        return NextResponse.json({ ok: false, error: 'Round results not available' }, { status: 409 })
      }
      const sorted = roundGuesses.sort((a: any, b: any) => {
        const da = (a.guess > actualTx ? a.guess - actualTx : actualTx - a.guess)
        const db = (b.guess > actualTx ? b.guess - actualTx : actualTx - b.guess)
        if (da !== db) return Number(da - db)
        return Number(a.submittedAt - b.submittedAt)
      })
      const first = sorted[0]
      const second = sorted[1]
      if (rewardType === 'second') {
        if (!second || second.fid !== fidBn) {
          return NextResponse.json({ ok: false, error: 'Not authorized: not second-place winner' }, { status: 403 })
        }
      } else if (rewardType === 'jackpot') {
        if (!first || first.fid !== fidBn || first.guess !== actualTx) {
          return NextResponse.json({ ok: false, error: 'Not authorized: not jackpot winner' }, { status: 403 })
        }
      }
    }
    }

    const prizeType: number = rewardType === 'first' ? 1 : rewardType === 'second' ? 2 : 3
    const amountBn = BigInt(amount)

    const now = Math.floor(Date.now() / 1000)
    const expiry = BigInt(now + 60 * 60) // +1h
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
      roundId: BigInt(roundId),
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

    return NextResponse.json({ ok: true, signature, claim: message, domain, tx: { to: contractAddress, data, chainId } })
  } catch (e) {
    const msg = e instanceof Error ? `${e.name}: ${e.message}` : 'Unknown error'
    return NextResponse.json({ ok: false, error: 'Internal error', detail: msg }, { status: 500 })
  }
}
