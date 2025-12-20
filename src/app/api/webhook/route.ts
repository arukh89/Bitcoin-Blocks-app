import { NextRequest, NextResponse } from 'next/server';

/**
 * Farcaster Webhook Handler
 * Receives events from Farcaster when users interact with the Mini App
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('[Webhook] Received event:', JSON.stringify(body, null, 2));

    // Handle different event types
    const { type, data } = body;

    switch (type) {
      case 'frame_added':
        // User added the frame/mini app
        console.log('[Webhook] Frame added by user:', data?.fid);
        break;

      case 'frame_removed':
        // User removed the frame/mini app
        console.log('[Webhook] Frame removed by user:', data?.fid);
        break;

      case 'notifications_enabled':
        // User enabled notifications
        console.log('[Webhook] Notifications enabled by user:', data?.fid);
        break;

      case 'notifications_disabled':
        // User disabled notifications
        console.log('[Webhook] Notifications disabled by user:', data?.fid);
        break;

      default:
        console.log('[Webhook] Unknown event type:', type);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Also handle GET for verification
export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Webhook endpoint active' });
}
