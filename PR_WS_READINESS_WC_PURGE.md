## Summary
Reliability and security improvements:
- Await all SpacetimeDB reducer calls and add initial snapshot retry/backoff to avoid “WebSocket CONNECTING state” errors.
- Remove RainbowKit provider to completely eliminate WalletConnect relay usage; wagmi connectors remain injected + coinbase only.

## Changes
- GameContext.tsx:
  - Await: createRound, submitGuess, endRoundManually, updateRoundResult, sendChatMessage, dailyCheckin
  - Initial snapshot now sequential with retry (3x, 400ms backoff)
- providers.tsx:
  - Remove RainbowKitProvider and styles import

## Validation
- pnpm build: success
- pnpm lint: clean
- CSP is already tightened (connect-src 'self' wss://maincloud.spacetimedb.com)

## Verification checklist after deploy
- DevTools → Network: no calls to relay.walletconnect.org or explorer-api.walletconnect.com
- Console: no CSP errors for WalletConnect
- SpacetimeDB dashboard: logs for get_active_round and get_prize_config appear on page load; admin actions succeed