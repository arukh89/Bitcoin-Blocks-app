/**
 * Server-side Supabase client for API routes
 * Use this instead of creating clients inline in each route
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for server-side use
 * Returns null if not properly configured
 */
export function createServerSupabase(): SupabaseClient<Database> | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase not configured: missing URL or key')
    return null
  }

  return createClient<Database>(supabaseUrl, supabaseKey)
}

/**
 * Get required environment variables for reward signing
 * Returns null if any required variable is missing
 */
export function getRewardSignerConfig() {
  const contractAddress = process.env.REWARD_CLAIMER_ADDRESS
  const tokenAddress = process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS
  const privateKey = process.env.REWARD_SIGNER_PRIVATE_KEY
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453)

  if (!contractAddress || !tokenAddress || !privateKey) {
    return null
  }

  return { contractAddress, tokenAddress, privateKey, chainId }
}

/**
 * Get check-in specific config (with fallbacks to main config)
 */
export function getCheckinSignerConfig() {
  const contractAddress = process.env.REWARD_CLAIMER_CHECKIN_ADDRESS || process.env.REWARD_CLAIMER_ADDRESS
  const tokenAddress = process.env.REWARD_TOKEN_CHECKIN_ADDRESS || process.env.NEXT_PUBLIC_REWARD_TOKEN_ADDRESS
  const privateKey = process.env.REWARD_SIGNER_PRIVATE_KEY
  const chainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 8453)

  if (!contractAddress || !tokenAddress || !privateKey) {
    return null
  }

  return { contractAddress, tokenAddress, privateKey, chainId }
}
