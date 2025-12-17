import { NextResponse, type NextRequest } from 'next/server'
import { isAddress } from 'viem'
import { createServerSupabase, getCheckinSignerConfig } from '@/lib/supabase-server'
import { signRewardClaim, generateNonce, generateExpiry } from '@/lib/reward-signer'

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

    // Get signer configuration
    const signerConfig = getCheckinSignerConfig()
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
    const userIdentifier = `fid-${fidNum}`
    const epochDay = dayId !== undefined && dayId !== null ? BigInt(dayId) : getTodayDayId()
    
    // Check if user has checked in today
    const todayStart = new Date()
    todayStart.setUTCHours(0, 0, 0, 0)
    
    const { data: checkins } = await supabase
      .from('checkins')
      .select('id')
      .eq('user_identifier', userIdentifier)
      .gte('checkin_date', todayStart.toISOString())
      .limit(1)

    const eligible = !checkins || checkins.length === 0

    if (!eligible) {
      return NextResponse.json({ ok: false, error: 'Not eligible for today\'s check-in' }, { status: 403 })
    }

    // Check for existing claim to prevent double claims
    const { data: existingClaim } = await supabase
      .from('reward_claims')
      .select('id')
      .eq('user_identifier', userIdentifier)
      .eq('claim_type', 'checkin')
      .gte('created_at', todayStart.toISOString())
      .single()

    if (existingClaim) {
      return NextResponse.json({ ok: false, error: 'Check-in reward already claimed today' }, { status: 409 })
    }

    // Record the claim attempt
    await supabase.from('reward_claims').insert({
      user_identifier: userIdentifier,
      claim_type: 'checkin',
      amount: Number(amount),
      token_address: tokenAddress,
      status: 'pending'
    })

    // Sign the claim using shared utility
    const message = {
      roundId: epochDay,
      fid: BigInt(fidNum),
      recipient: recipient as `0x${string}`,
      amount: BigInt(amount),
      prizeType: 4, // check-in prize type
      nonce: generateNonce(),
      expiry: generateExpiry(),
    }

    const signedClaim = await signRewardClaim(message, contractAddress, chainId, privateKey)
    return NextResponse.json({ ok: true, ...signedClaim })
  } catch (e) {
    console.error('checkin sign-claim error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
