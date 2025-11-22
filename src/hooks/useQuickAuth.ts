import { useEffect } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'
import { useAuth } from '@/AuthContext/AuthContext'

export function useQuickAuth(isInFarcaster: boolean): void {
  const { signInWithWallet } = useAuth()

  useEffect(() => {
    (async () => {
      if (!isInFarcaster) return
      try {
        await sdk.actions.ready()
        const context = await sdk.context
        if (context?.user?.fid) {
          // Derive a stable pseudo-address from fid and sign in to unify UI state
          const fidHex = context.user.fid.toString(16)
          const address = `0x${fidHex.padStart(40, '0')}`
          await signInWithWallet(address)
        }
      } catch {
        // ignore
      }
    })()
  }, [isInFarcaster, signInWithWallet])
}
