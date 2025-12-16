import { NextResponse, type NextRequest } from 'next/server'
import { isAddress, encodeFunctionData, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RewardClaimerAbi } from '@/lib/abis/rewardClaimer'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Body = {
  recipient: string
  amount: string
  fid?: string | number
  dayId?: string | number
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

    const fidNum = fid !== undefined && fid !== null ? Number(fid) : 0
    if (fidNum === 0) {
      return NextResponse.json({ ok: false, error: 'Missing fid' }, { status: 400 })
    }

    const devNoDb = (process.env.DEV_NO_DB || '').toLowerCase() === '1' || (process.env.DEV_NO_DB || '').toLowerCase() === 'true'
    const allowBypass = devNoDb && process.env.NODE_ENV !== 'production'

    let eligible = true
    let epochDay = dayId !== undefined && dayId !== null ? BigInt(dayId) : getTodayDayId()

    if (!allowBypass) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json({ ok: false, error: 'Supabase not configured' }, { status: 500 })
      }

      const supabase = createClient(supabaseUrl, supabaseKey)
      const userIdentifier = `fid-${fidNum}`
      
      // Check if user has checked in today
      const todayStart = new Date()
      todayStart.setUTCHours(0, 0, 0, 0)
      
      const { data: checkins } = await supabase
        .from('checkins')
        .select('id')
        .eq('user_identifier', userIdentifier)
        .gte('checkin_date', todayStart.toISOString())
        .limit(1)

      eligible = checkins && checkins.length > 0
    }

    if (!eligible) {
      return NextResponse.json({ ok: false, error: 'Not eligible for today\'s check-in' }, { status: 403 })
    }

    const prizeType = 4 // check-in prize type
    const amountBn = BigInt(amount)
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
    console.error('checkin sign-claim error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
