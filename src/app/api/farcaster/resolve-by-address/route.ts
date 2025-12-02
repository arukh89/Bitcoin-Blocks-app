import { NextResponse } from 'next/server'

type Resolved = {
  found: boolean
  fid?: number
  username?: string
  displayName?: string
  pfpUrl?: string
}

const cache = new Map<string, { data: Resolved; ts: number }>()
const TTL_MS = 5 * 60 * 1000 // 5 minutes

function fromCache(address: string): Resolved | null {
  const e = cache.get(address.toLowerCase())
  if (!e) return null
  if (Date.now() - e.ts > TTL_MS) {
    cache.delete(address.toLowerCase())
    return null
  }
  return e.data
}

function toCache(address: string, data: Resolved) {
  cache.set(address.toLowerCase(), { data, ts: Date.now() })
}

function isHexAddress(a: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(a)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const address = (searchParams.get('address') || '').trim()
    if (!isHexAddress(address)) {
      return NextResponse.json({ found: false }, { status: 200 })
    }

    const cached = fromCache(address)
    if (cached) return NextResponse.json(cached)

    const apiKey = process.env.NEYNAR_API_KEY
    if (!apiKey) {
      // No key configured; gracefully return not found
      const res: Resolved = { found: false }
      toCache(address, res)
      return NextResponse.json(res)
    }

    const headers = { 'X-API-KEY': apiKey }

    // 1) Try verified addresses
    let candidate: any | null = null
    try {
      const url = `https://api.neynar.com/v2/farcaster/users-by-verification?address=${address}`
      const r = await fetch(url, { headers, cache: 'no-store' })
      if (r.ok) {
        const j: any = await r.json()
        const users: any[] = j?.users || j?.result || []
        if (Array.isArray(users) && users.length > 0) {
          candidate = users[0]
        }
      }
    } catch {}

    // 2) Fallback to custody address if not verified
    if (!candidate) {
      try {
        const url = `https://api.neynar.com/v2/farcaster/users-by-custody-address?address=${address}`
        const r = await fetch(url, { headers, cache: 'no-store' })
        if (r.ok) {
          const j: any = await r.json()
          const user = j?.user || j?.result?.user || null
          if (user) candidate = user
        }
      } catch {}
    }

    if (!candidate) {
      const res: Resolved = { found: false }
      toCache(address, res)
      return NextResponse.json(res)
    }

    const fid: number | undefined = Number(candidate?.fid)
    const username: string | undefined = candidate?.username || candidate?.handle || undefined
    const pfpUrl: string | undefined = candidate?.pfp_url || candidate?.pfpUrl || candidate?.profile?.image_url
    const displayName: string | undefined = candidate?.display_name || candidate?.displayName

    const result: Resolved = fid
      ? { found: true, fid, username, displayName, pfpUrl }
      : { found: false }

    toCache(address, result)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ found: false }, { status: 200 })
  }
}
