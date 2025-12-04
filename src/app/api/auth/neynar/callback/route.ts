import { NextResponse, type NextRequest } from 'next/server'
import { baseCookieOptions } from '@/lib/cookies'

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get('code')
  
  if (!code) {
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch('https://api.neynar.com/v2/farcaster/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID,
        client_secret: process.env.NEYNAR_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      console.error('Token exchange failed:', await tokenRes.text())
      throw new Error('Token exchange failed')
    }
    
    const { user } = await tokenRes.json()

    // Set session cookie
    const res = NextResponse.redirect(new URL('/', req.url))
    res.cookies.set('neynar_session', JSON.stringify({
      fid: user.fid,
      username: user.username,
      pfpUrl: user.pfp_url,
    }), baseCookieOptions({ maxAge: 60 * 60 * 24 * 7 }))

    return res
  } catch (error) {
    console.error('Neynar callback error:', error)
    return NextResponse.redirect(new URL('/?error=auth_failed', req.url))
  }
}

