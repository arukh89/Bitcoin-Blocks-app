import { createClient, SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

let supabase: SupabaseClient<Database>

if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
} else {
  // Create a dummy client that will fail gracefully
  console.warn('Supabase environment variables not configured')
  supabase = createClient<Database>('https://placeholder.supabase.co', 'placeholder', {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  })
}

export { supabase }
export type { Database }
