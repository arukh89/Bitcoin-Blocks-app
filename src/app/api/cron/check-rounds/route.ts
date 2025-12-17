import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

// Use env var with fallback to public mempool API
const MEMPOOL_API = process.env.MEMPOOL_API_BASE || 'https://mempool.space/api'

export async function GET(request: Request) {
  // Verify cron secret for security (REQUIRED)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // SECURITY: Always require CRON_SECRET in production
  if (!cronSecret) {
    console.error('CRON_SECRET not configured')
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
  }
  
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = createServerSupabase()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    // Get all open rounds
    const { data: openRounds, error: roundsError } = await supabase
      .from('rounds')
      .select('*')
      .eq('status', 'open')

    if (roundsError) throw roundsError
    if (!openRounds || openRounds.length === 0) {
      return NextResponse.json({ message: 'No open rounds' })
    }

    const results = []

    for (const round of openRounds) {
      const now = new Date()
      const endTime = new Date(round.end_time)
      
      // Check if round has expired by time
      if (now >= endTime) {
        await supabase
          .from('rounds')
          .update({ status: 'closed' })
          .eq('id', round.id)
        
        results.push({ roundId: round.id, action: 'closed_by_time' })
        continue
      }

      // Check if target block exists
      if (round.block_number) {
        try {
          const blockRes = await fetch(`${MEMPOOL_API}/block-height/${round.block_number}`, {
            signal: AbortSignal.timeout(5000)
          })
          
          if (blockRes.ok) {
            // Block found! Close the round
            await supabase
              .from('rounds')
              .update({ status: 'closed' })
              .eq('id', round.id)
            
            results.push({ roundId: round.id, blockNumber: round.block_number, action: 'closed_by_block' })
            
            // Log the event
            await supabase.from('logs').insert({
              event_type: 'auto_close_by_block',
              details: `Round ${round.id} closed - Block #${round.block_number} found`,
            })
          } else {
            results.push({ roundId: round.id, blockNumber: round.block_number, action: 'block_not_found' })
          }
        } catch {
          results.push({ roundId: round.id, blockNumber: round.block_number, action: 'check_failed' })
        }
      }
    }

    return NextResponse.json({ success: true, results, checkedAt: new Date().toISOString() })
  } catch (error) {
    console.error('Cron check-rounds error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
