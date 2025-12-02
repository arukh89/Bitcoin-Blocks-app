import { NextResponse, type NextRequest } from 'next/server'
import { SiweMessage } from 'siwe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { message, signature } = await req.json() as { message: string; signature: string }
    if (!message || !signature) {
      return NextResponse.json({ ok: false, error: 'Missing message or signature' }, { status: 400 })
    }

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
    res.cookies.set('siwe_session', JSON.stringify({ address }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    // Clear nonce after use
    res.cookies.set('siwe_nonce', '', { httpOnly: true, sameSite: 'lax', secure: true, path: '/', maxAge: 0 })
    return res
  } catch (e) {
    console.error('SIWE verify error', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
