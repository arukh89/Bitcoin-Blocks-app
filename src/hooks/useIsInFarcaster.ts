import { useEffect, useState } from 'react'
import { sdk } from '@farcaster/miniapp-sdk'

export function useIsInFarcaster(): boolean {
  const [isIn, setIsIn] = useState(false)
  useEffect(() => {
    (async () => {
      try {
        await sdk.actions.ready()
        await sdk.context
        setIsIn(true)
      } catch {
        setIsIn(false)
      }
    })()
  }, [])
  return isIn
}
