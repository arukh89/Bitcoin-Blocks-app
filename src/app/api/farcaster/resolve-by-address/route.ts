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
      console.log('[resolve-by-address] Invalid address format:', address)
      return NextResponse.json({ found: false, reason: 'invalid_address' }, { status: 200 })
    }

    const cached = fromCache(address)
    if (cached) {
      console.log('[resolve-by-address] Cache hit for:', address, cached)
      return NextResponse.json(cached)
    }

    const apiKey = process.env.NEYNAR_API_KEY
    if (!apiKey) {
      // No key configured; gracefully return not found
      console.warn('[resolve-by-address] NEYNAR_API_KEY not configured!')
      const res: Resolved = { found: false }
      toCache(address, res)
      return NextResponse.json({ ...res, reason: 'no_api_key' })
    }
    
    console.log('[resolve-by-address] Looking up address:', address)

    const headers = { 'api_key': apiKey, 'Content-Type': 'application/json' }

    // 1) Try verified addresses (connected wallets)
    let candidate: any | null = null
    try {
      const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${address.toLowerCase()}`
      console.log('[resolve-by-address] Trying bulk-by-address:', url)
      const r = await fetch(url, { headers, cache: 'no-store' })
      if (r.ok) {
        const j: any = await r.json()
        console.log('[resolve-by-address] bulk-by-address response:', JSON.stringify(j).slice(0, 500))
        // Response format: { [address]: [{ fid, username, ... }] }
        const users = j?.[address.toLowerCase()] || j?.[address] || []
        if (Array.isArray(users) && users.length > 0) {
          candidate = users[0]
          console.log('[resolve-by-address] Found via verified address:', candidate?.username)
        }
      } else {
        console.log('[resolve-by-address] bulk-by-address failed:', r.status, await r.text())
      }
    } catch (e) {
      console.log('[resolve-by-address] bulk-by-address error:', e)
    }

    // 2) Fallback to custody address if not verified
    if (!candidate) {
      try {
        const url = `https://api.neynar.com/v2/farcaster/user/custody-address?custody_address=${address}`
        const r = await fetch(url, { headers, cache: 'no-store' })
        if (r.ok) {
          const j: any = await r.json()
          const user = j?.user || j?.result?.user || null
          if (user) {
            candidate = user
            console.log('[resolve-by-address] Found via custody address:', user?.username)
          }
        }
      } catch (e) {
        console.log('[resolve-by-address] Custody lookup failed:', e)
      }
    }

    if (!candidate) {
      console.log('[resolve-by-address] No Farcaster account found for:', address)
      const res: Resolved = { found: false }
      toCache(address, res)
      return NextResponse.json({ ...res, reason: 'not_found' })
    }
    
    console.log('[resolve-by-address] Found candidate:', candidate?.username, candidate?.fid)

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
