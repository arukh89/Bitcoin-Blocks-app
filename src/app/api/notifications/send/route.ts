import { NextRequest, NextResponse } from 'next/server';
import { APP_CONFIG, isAdminFid } from '@/config/app-config';

/**
 * Send notifications to Farcaster users via Neynar
 * Admin-only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminFid, targetFids, title, body: notificationBody, targetUrl } = body;

    // Validate admin
    if (!adminFid || !isAdminFid(adminFid)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Admin only' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!title || !notificationBody) {
      return NextResponse.json(
        { success: false, error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // For now, just log the notification (actual implementation requires Neynar webhook setup)
    console.log('[Notifications] Send request:', {
      from: adminFid,
      to: targetFids || 'all subscribers',
      title,
      body: notificationBody,
      url: targetUrl,
    });

    // TODO: Implement actual notification sending via Neynar
    // This requires:
    // 1. Storing user notification tokens when they enable notifications
    // 2. Using Neynar's notification API to send push notifications
    
    return NextResponse.json({
      success: true,
      sent: targetFids?.length || 0,
      message: 'Notification queued (implementation pending)',
    });
  } catch (error: any) {
    console.error('[Notifications] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send notification' },
      { status: 500 }
    );
  }
}
