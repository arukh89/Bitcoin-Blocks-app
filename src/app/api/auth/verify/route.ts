import { NextResponse, type NextRequest } from 'next/server'
import { SiweMessage } from 'siwe'
import { z } from 'zod'
import { validateInput } from '@/lib/validation'
import { baseCookieOptions } from '@/lib/cookies'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  message: z.string().min(1),
  signature: z.string().min(1)
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { valid, data, error } = await validateInput(bodySchema)(req)
    if (!valid) return NextResponse.json({ ok: false, error: String(error) }, { status: 400 })
    const { message, signature } = data

    const domain = process.env.AUTH_DOMAIN
    const origin = process.env.NEXT_PUBLIC_APP_URL
    if (!domain || !origin) {
      return NextResponse.json({ ok: false, error: 'Server misconfigured (AUTH_DOMAIN or NEXT_PUBLIC_APP_URL missing)' }, { status: 500 })
    }

    const cookieNonce = req.cookies.get('siwe_nonce')?.value
    if (!cookieNonce) {
      return NextResponse.json({ ok: false, error: 'Missing nonce cookie' }, { status: 400 })
    }

    const siwe = new SiweMessage(message)
    const result = await siwe.verify({ signature, domain, nonce: cookieNonce })
    if (!result.success) {
      return NextResponse.json({ ok: false, error: 'Invalid SIWE' }, { status: 401 })
    }

    // Bind session to address
    const address = siwe.address
    const res = NextResponse.json({ ok: true, address })
    res.cookies.set('siwe_session', JSON.stringify({ address }), baseCookieOptions({ maxAge: 60 * 60 * 24 * 7 }))
    // Clear nonce after use
    res.cookies.set('siwe_nonce', '', baseCookieOptions({ maxAge: 0 }))
    return res
  } catch (e) {
    console.error('SIWE verify error', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
