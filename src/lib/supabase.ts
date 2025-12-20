import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
}
if (!supabaseAnonKey) {
  console.error('[Supabase] Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Note: Realtime subscriptions are handled directly in GameContext
// to avoid duplicate subscription management
