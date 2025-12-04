import { NextResponse, type NextRequest } from 'next/server'
import { generateNonce } from 'siwe'
import { baseCookieOptions } from '@/lib/cookies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const nonce = generateNonce()
  const res = NextResponse.json({ nonce })
  // HttpOnly cookie for nonce to bind SIWE verification
  res.cookies.set('siwe_nonce', nonce, baseCookieOptions({ maxAge: 60 * 10 }))
  return res
}
