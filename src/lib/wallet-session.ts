import 'client-only'
import { connect, getAccount, getConnectors, signMessage, getChainId } from '@wagmi/core'
import { config } from '@/providers/WagmiProviders'
import { SiweMessage } from 'siwe'

export async function ensureWalletSession(): Promise<string> {
  // 1) Ensure wallet connection (mini app => Warplet overlay; web => injected)
  let account = getAccount(config)
  if (!account.isConnected) {
    const connectors = getConnectors(config)
    const injected = connectors.find((c) => c.id === 'injected') || connectors[0]
    if (!injected) throw new Error('No wallet connector available')
    await connect(config, { connector: injected })
    account = getAccount(config)
  }

  const address = account.address
  if (!address) throw new Error('No wallet address')

  // 2) Fetch nonce from server
  const nonceRes = await fetch('/api/auth/nonce', { method: 'GET', credentials: 'include' })
  if (!nonceRes.ok) throw new Error('Failed to get nonce')
  const { nonce } = (await nonceRes.json()) as { nonce: string }

  // Use window.location for client-side
  const origin = window.location.origin
  const domain = new URL(origin).host
  const chainId = getChainId(config)

  // 3) Build SIWE message - minimal fields to avoid "max line number" error
  // SIWE library has strict validation: max 6 lines in message
  const siwe = new SiweMessage({
    domain,
    address,
    uri: origin,
    version: '1',
    chainId,
    nonce,
    issuedAt: new Date().toISOString(),
  })

  const prepared = siwe.prepareMessage()

  // 4) Sign message
  const signature = await signMessage(config, { message: prepared })

  // 5) Verify on server and set session cookie
  const verifyRes = await fetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ message: prepared, signature }),
  })
  if (!verifyRes.ok) throw new Error('SIWE verification failed')

  return address
}
