import { NextResponse, type NextRequest } from 'next/server'
import {
  isAddress,
  encodeFunctionData,
  type Hex,
} from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RewardClaimerAbi } from '@/lib/abis/rewardClaimer'

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
    // Map rewardType -> prizeType (uint8)
    const prizeType: number =
      rewardType === 'first' ? 1 : rewardType === 'second' ? 2 : 3

    // Parse amount (raw string expected as whole token units in DB UI). If token has 18 decimals, adjust here if desired.
    // For now assume "amount" provided is already in token smallest units.
    const amountBn = BigInt(amount)
    const roundIdBn = BigInt(roundId)

    // Require fid (as uint256) — derive from client when using Farcaster auth
    const fidBn = fid !== undefined && fid !== null
      ? BigInt(typeof fid === 'string' ? fid : String(fid))
      : BigInt(0)
    if (fidBn === 0n) {
      return NextResponse.json({ ok: false, error: 'Missing fid' }, { status: 400 })
    }

    // Nonce & expiry
    const now = Math.floor(Date.now() / 1000)
    const expiry = BigInt(now + 60 * 60) // +1h
    // Simple nonce: timestamp millis + random tail
    const nonce = BigInt(BigInt(Date.now()) ^ BigInt(Math.floor(Math.random() * 1e9)))

    // EIP-712 domain — IMPORTANT: must match contract
    // Assumed constants used in contract: name "RewardClaimer", version "1"
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

    // Prepare encoded tx for convenience
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

    return NextResponse.json({
      ok: true,
      signature,
      claim: message,
      domain,
      tx: { to: contractAddress, data, chainId },
    })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
