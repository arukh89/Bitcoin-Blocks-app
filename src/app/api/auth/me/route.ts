import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
import { createClient, Errors } from '@farcaster/quick-auth'

const client = createClient()

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authorization = request.headers.get('Authorization')
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 })
    }

    const token = authorization.split(' ')[1]
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 401 })
    }

    // Derive auth domain from NEXT_PUBLIC_APP_URL (removes https:// prefix)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY

    if (!appUrl) {
      return NextResponse.json({ error: 'Server misconfiguration: NEXT_PUBLIC_APP_URL is not set' }, { status: 500 })
    }
    if (!NEYNAR_API_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration: NEYNAR_API_KEY is not set' }, { status: 500 })
    }

    // Extract domain from URL (e.g., "https://example.com" -> "example.com")
    const authDomain = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

    const payload = await client.verifyJwt({
      token,
      domain: authDomain
    })

    

    const userResponse = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${payload.sub}`, {
      headers: {
        'accept': 'application/json',
        'api_key': NEYNAR_API_KEY
      }
    })

    if (!userResponse.ok) {
      return NextResponse.json({
        fid: payload.sub,
        username: `user-${payload.sub}`,
        displayName: `User ${payload.sub}`,
        pfpUrl: ''
      })
    }

    const userData = await userResponse.json()
    // Neynar bulk endpoint returns { users: [...] }
    const user = userData.users?.[0] || userData.result?.user || userData.user

    return NextResponse.json({
      fid: user?.fid || payload.sub,
      username: user?.username || `user-${payload.sub}`,
      displayName: user?.display_name || user?.displayName || `User ${payload.sub}`,
      pfpUrl: user?.pfp_url || user?.pfpUrl || '',
      bio: user?.profile?.bio?.text || user?.bio || ''
    })
  } catch (error) {
    console.error('Authentication error:', error)
    
    if (error instanceof Errors.InvalidTokenError) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
