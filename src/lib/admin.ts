export const ADMIN_FIDS: number[] = (process.env.NEXT_PUBLIC_ADMIN_FIDS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(n => Number(n))
  .filter(n => Number.isFinite(n) && n > 0)

export const ADMIN_WALLETS: string[] = (process.env.NEXT_PUBLIC_ADMIN_WALLETS || '')
  .split(',')
  .map(s => s.trim().toLowerCase())
  .filter(s => /^0x[a-f0-9]{40}$/.test(s))

export function isAdminFid(fid?: number | null): boolean {
  if (fid == null) return false
  return ADMIN_FIDS.includes(Number(fid))
}

export function isAdminWallet(address?: string | null): boolean {
  if (!address) return false
  return ADMIN_WALLETS.includes(address.toLowerCase())
}

export function isAdminAddress(identifier?: string | null): boolean {
  if (!identifier) return false
  if (identifier.startsWith('fid-')) {
    const fid = Number(identifier.slice(4))
    return isAdminFid(fid)
  }
  if (/^0x[a-fA-F0-9]{40}$/.test(identifier)) {
    return isAdminWallet(identifier)
  }
  return false
}
