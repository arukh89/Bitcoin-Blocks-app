"use client"

import { APP_CONFIG } from '@/config/app-config';

/**
 * Neynar API client for Farcaster user lookups
 */

export interface FarcasterUserData {
  fid: number
  username: string
  displayName: string
  pfpUrl: string
  custodyAddress?: string
  verifiedAddresses?: string[]
}

export async function fetchUserByFid(fid: number): Promise<FarcasterUserData | null> {
  try {
    const response = await fetch(`${APP_CONFIG.neynar.baseUrl}/user/bulk?fids=${fid}`, {
      headers: {
        'accept': 'application/json',
        'api_key': APP_CONFIG.neynar.apiKey
      }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const user = data?.users?.[0]
    
    if (user) {
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        custodyAddress: user.custody_address,
        verifiedAddresses: user.verified_addresses?.eth_addresses || [],
      }
    }
  } catch (error) {
    console.warn('Failed to fetch user by FID:', error)
  }
  return null
}

export async function fetchUserByAddress(address: string): Promise<FarcasterUserData | null> {
  try {
    const response = await fetch(`${APP_CONFIG.neynar.baseUrl}/user/bulk-by-address?addresses=${address.toLowerCase()}`, {
      headers: {
        'accept': 'application/json',
        'api_key': APP_CONFIG.neynar.apiKey
      }
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    const users = data?.[address.toLowerCase()]
    const user = users?.[0]
    
    if (user) {
      return {
        fid: user.fid,
        username: user.username,
        displayName: user.display_name,
        pfpUrl: user.pfp_url,
        custodyAddress: user.custody_address,
        verifiedAddresses: user.verified_addresses?.eth_addresses || [],
      }
    }
  } catch (error) {
    console.warn('Failed to fetch user by address:', error)
  }
  return null
}
