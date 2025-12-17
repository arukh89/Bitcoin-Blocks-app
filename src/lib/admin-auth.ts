/**
 * Server-side admin authentication utilities
 * SECURITY: Never trust client-side admin checks alone
 */

// Re-export from shared constants for convenience
export {
  ADMIN_FIDS,
  ADMIN_WALLETS,
  isAdminFid,
  isAdminWallet,
  isAdminUser
} from './admin-constants'

import { isAdminFid } from './admin-constants'

/**
 * Extract FID from authorization header (JWT token)
 * Returns null if not authenticated or invalid
 */
export async function extractFidFromAuth(authHeader: string | null): Promise<number | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  try {
    const { createClient } = await import('@farcaster/quick-auth')
    const client = createClient()
    const token = authHeader.split(' ')[1]
    
    // Derive auth domain from NEXT_PUBLIC_APP_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL
    if (!appUrl || !token) {
      return null
    }
    
    // Extract domain from URL (e.g., "https://example.com" -> "example.com")
    const authDomain = appUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')

    const payload = await client.verifyJwt({
      token,
      domain: authDomain
    })

    return Number(payload.sub)
  } catch {
    return null
  }
}

/**
 * Verify admin access from request
 * Returns { isAdmin: boolean, fid: number | null, error?: string }
 */
export async function verifyAdminAccess(request: Request): Promise<{
  isAdmin: boolean
  fid: number | null
  error?: string
}> {
  const authHeader = request.headers.get('Authorization')
  const fid = await extractFidFromAuth(authHeader)

  if (!fid) {
    return { isAdmin: false, fid: null, error: 'Not authenticated' }
  }

  if (!isAdminFid(fid)) {
    return { isAdmin: false, fid, error: 'Not authorized as admin' }
  }

  return { isAdmin: true, fid }
}
