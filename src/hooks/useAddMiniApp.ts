import { useCallback } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function useAddMiniApp() {
  const addMiniApp = useCallback(async () => {
    try {
      await sdk.actions.ready()
      // If running inside Farcaster, suggest adding the app (no-op if already added)
      if (typeof sdk.actions.addToMiniApps === 'function') {
        await sdk.actions.addToMiniApps()
      }
    } catch {
      // no-op outside Farcaster
    }
  }, [])

  return { addMiniApp }
}
