import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Realtime subscription helper
export function subscribeToRounds(callback: (payload: any) => void) {
  return supabase
    .channel('rounds-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, callback)
    .subscribe();
}

export function subscribeToGuesses(roundId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`guesses-${roundId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'guesses',
      filter: `round_id=eq.${roundId}`
    }, callback)
    .subscribe();
}

export function subscribeToChat(roundId: string, callback: (payload: any) => void) {
  return supabase
    .channel(`chat-${roundId}`)
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'chat_messages',
      filter: `round_id=eq.${roundId}`
    }, callback)
    .subscribe();
}
