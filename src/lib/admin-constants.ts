/**
 * Admin configuration constants
 * Shared between client and server code
 * 
 * IMPORTANT: This file is used by both client ('use client') and server components.
 * Only use NEXT_PUBLIC_ environment variables here.
 */

// Admin FIDs from environment
const ADMIN_FIDS_RAW = process.env.NEXT_PUBLIC_ADMIN_FIDS || ''
export const ADMIN_FIDS: number[] = ADMIN_FIDS_RAW
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(n => Number(n))
  .filter(n => Number.isFinite(n) && n > 0)

// Admin wallet addresses from environment
const ADMIN_WALLETS_RAW = process.env.NEXT_PUBLIC_ADMIN_WALLETS || ''
export const ADMIN_WALLETS: string[] = ADMIN_WALLETS_RAW
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(s => /^0x[a-f0-9]{40}$/.test(s))

/**
 * Check if a FID is an admin
 */
export function isAdminFid(fid: number): boolean {
  return ADMIN_FIDS.includes(fid)
}

/**
 * Check if a wallet address is an admin
 */
export function isAdminWallet(address: string): boolean {
  if (!address) return false
  return ADMIN_WALLETS.includes(address.toLowerCase())
}

/**
 * Check if a user identifier (fid-xxx or 0x...) is an admin
 */
export function isAdminUser(userIdentifier: string): boolean {
  if (!userIdentifier) return false
  
  if (userIdentifier.startsWith('fid-')) {
    const fid = Number(userIdentifier.slice(4))
    return isAdminFid(fid)
  }
  
  if (/^0x[a-fA-F0-9]{40}$/.test(userIdentifier)) {
    return isAdminWallet(userIdentifier)
  }
  
  return false
}
