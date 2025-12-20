'use client';

export const APP_CONFIG = {
  // App Info
  name: 'Bitcoin Blocks',
  description: 'Predict Bitcoin block transactions and win prizes!',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

  // Admin FIDs (Farcaster IDs)
  adminFids: (process.env.NEXT_PUBLIC_ADMIN_FIDS || '250704,1107084')
    .split(',')
    .map(Number)
    .filter(Boolean),

  // Game settings
  defaultRoundDuration: 10, // minutes
  maxGuessValue: 10000,
  minGuessValue: 1,

  // Prize config defaults
  defaultPrize: {
    jackpot: 5000,
    firstPlace: 1000,
    secondPlace: 500,
    currency: '$SECOND',
  },

  // Supabase Realtime
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },

  // Neynar API
  neynar: {
    apiKey: process.env.NEXT_PUBLIC_NEYNAR_API_KEY || 'NEYNAR_API_DOCS',
    baseUrl: 'https://api.neynar.com/v2/farcaster',
  },
};

export function isAdminFid(fid: number | undefined): boolean {
  if (!fid) return false;
  return APP_CONFIG.adminFids.includes(fid);
}
