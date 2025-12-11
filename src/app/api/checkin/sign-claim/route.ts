import { NextResponse, type NextRequest } from 'next/server'
import { isAddress, encodeFunctionData, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RewardClaimerAbi } from '@/lib/abis/rewardClaimer'
import { DbConnection } from '@/spacetime_module_bindings'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  recipient: string
  amount: string // expected in smallest units
  fid?: string | number
  dayId?: string | number // optional override; defaults to today (UTC) epoch day
}

function getTodayDayId(): bigint {
  const nowSec = Math.floor(Date.now() / 1000)
  return BigInt(Math.floor(nowSec / 86400))
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { recipient, amount, fid, dayId } = (await req.json()) as Body
    if (!recipient || !amount) {
      return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })
    }
    if (!isAddress(recipient)) {
      return NextResponse.json({ ok: false, error: 'Invalid address' }, { status: 400 })
    }

    const contractAddress = process.env.REWARD_CLAIMER_CHECKIN_ADDRESS || process.env.REWARD_CLAIMER_ADDRESS
    const tokenAddress = process.env.REWARD_TOKEN_CHECKIN_ADDRESS || process.env.REWARD_TOKEN_ADDRESS
    const pk = process.env.REWARD_SIGNER_PRIVATE_KEY
    const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453)

    if (!contractAddress || !tokenAddress || !chainId) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 })
    }
    if (!pk) {
      return NextResponse.json({ ok: false, error: 'Signer not configured' }, { status: 501 })
    }

    const fidBn = fid !== undefined && fid !== null ? BigInt(typeof fid === 'string' ? fid : String(fid)) : 0n
    if (fidBn === 0n) {
      return NextResponse.json({ ok: false, error: 'Missing fid' }, { status: 400 })
    }

    // Validate eligibility from SpacetimeDB
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

    const epochDay = dayId !== undefined && dayId !== null ? BigInt(typeof dayId === 'string' ? dayId : String(dayId)) : getTodayDayId()
    const userIdentifier = `fid-${fidBn.toString()}`

    const checkins = Array.from(conn.db.checkins.iter()) as any[]
    const eligible = checkins.some((c: any) => {
      const cDay = BigInt(Math.floor(Number(c.checkinDate) / 86400))
      return c.userIdentifier === userIdentifier && cDay === epochDay
    })

    if (!eligible) {
      return NextResponse.json({ ok: false, error: 'Not eligible for today\'s check-in' }, { status: 403 })
    }

    const prizeType = 4 // dedicated prize type for check-in
    const amountBn = BigInt(amount)

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
        { name: 'roundId', type: 'uint256' }, // reuse as dayId
        { name: 'fid', type: 'uint256' },
        { name: 'recipient', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'prizeType', type: 'uint8' },
        { name: 'nonce', type: 'uint256' },
        { name: 'expiry', type: 'uint256' },
      ],
    } as const

    const message = {
      roundId: epochDay,
      fid: fidBn,
      recipient: recipient as `0x${string}`,
      amount: amountBn,
      prizeType,
      nonce,
      expiry,
    }

    const account = privateKeyToAccount(pk as Hex)
    const signature = await account.signTypedData({ domain, types, primaryType: 'Claim', message })

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
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
