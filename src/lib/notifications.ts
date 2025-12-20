// Farcaster Mini App Notification Helpers

/**
 * Prompt user to add the MiniApp (enables notifications)
 */
export async function promptAddMiniApp(): Promise<boolean> {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    
    if (sdk?.actions?.addMiniApp) {
      const result = await sdk.actions.addMiniApp();
      // Result contains notificationDetails if notifications were enabled
      return !!(result as any)?.notificationDetails || !!(result as any)?.added;
    }
    
    return false;
  } catch (e) {
    console.error('[Notifications] Failed to prompt add:', e);
    return false;
  }
}

/**
 * Check if user has added the MiniApp (notifications enabled)
 */
export async function checkMiniAppAdded(): Promise<boolean> {
  try {
    const { sdk } = await import('@farcaster/miniapp-sdk');
    
    // The context will have notificationDetails if notifications are enabled
    const context = await sdk.context;
    return !!context?.client?.notificationDetails;
  } catch (e) {
    return false;
  }
}

/**
 * Send notification to specific users (admin only)
 */
export async function sendNotification(params: {
  adminFid: number;
  targetFids?: number[];
  title: string;
  body: string;
  targetUrl?: string;
}): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    return await response.json();
  } catch (e) {
    return { success: false, error: 'Failed to send notification' };
  }
}

// Notification templates for Bitcoin Blocks events
export const NotificationTemplates = {
  roundStarted: (roundNumber: number, blockNumber: number) => ({
    title: '🎮 New Round Started!',
    body: `Round #${roundNumber} is open! Predict Block #${blockNumber.toLocaleString()} txs.`,
  }),
  
  roundEnding: (roundNumber: number, minutesLeft: number) => ({
    title: '⏰ Round Ending Soon!',
    body: `Round #${roundNumber} closes in ${minutesLeft} min. Submit your prediction!`,
  }),
  
  winnerAnnouncement: (roundNumber: number, winnerUsername: string, isJackpot: boolean) => ({
    title: isJackpot ? '🎰 JACKPOT WINNER!' : '🏆 Winner Announced!',
    body: isJackpot 
      ? `@${winnerUsername} hit the JACKPOT in Round #${roundNumber}!`
      : `@${winnerUsername} won Round #${roundNumber}! Check results.`,
  }),
  
  youWon: (roundNumber: number, prize: number, currency: string, isJackpot: boolean) => ({
    title: isJackpot ? '🎰💰 YOU WON THE JACKPOT!' : '🏆 You Won!',
    body: `Congrats! You won ${prize.toLocaleString()} ${currency} in Round #${roundNumber}. Claim now!`,
  }),
  
  claimReminder: (roundNumber: number, hoursLeft: number) => ({
    title: '⚠️ Claim Your Prize!',
    body: `Only ${hoursLeft}h left to claim your Round #${roundNumber} prize!`,
  }),
};
