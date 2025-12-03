import { NextResponse, type NextRequest } from 'next/server'
import { generateNonce } from 'siwe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest): Promise<NextResponse> {
  const nonce = generateNonce()
  const res = NextResponse.json({ nonce })
  // HttpOnly cookie for nonce to bind SIWE verification
  const secure = process.env.NODE_ENV === 'production' || (process.env.NEXT_PUBLIC_APP_URL?.startsWith('https://') ?? false)
  res.cookies.set('siwe_nonce', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 60 * 10, // 10 minutes
  })
  return res
}
