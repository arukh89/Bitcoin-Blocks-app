import sdk from '@farcaster/miniapp-sdk'

/**
 * Detect if running in Base App (TBA - The Base App)
 */
export function isInBaseApp(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  // Base App detection - check for base-specific indicators
  return ua.includes('base') || ua.includes('coinbase') || !!(window as any).coinbaseWalletExtension
}

/**
 * Detect if running in Farcaster mini app
 */
export function isInFarcasterApp(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  const inFrame = window.top !== window.self
  return inFrame || ua.includes('farcaster') || ua.includes('warpcast')
}

/**
 * Get Ethereum provider - works in Farcaster, Base App, and web browser
 * Priority: Farcaster SDK > Coinbase Wallet > window.ethereum
 */
export async function getEthereumProvider(): Promise<any> {
  // 1. Try Farcaster SDK first (for Warpcast mini app)
  try {
    const provider = await sdk.wallet.ethProvider
    if (provider) {
      console.log('🟣 Using Farcaster wallet provider')
      return provider
    }
  } catch {
    // Not in Farcaster context
  }

  // 2. Try Coinbase Wallet (for Base App)
  const coinbaseProvider = (window as any).coinbaseWalletExtension
  if (coinbaseProvider) {
    console.log('🔵 Using Coinbase/Base wallet provider')
    return coinbaseProvider
  }

  // 3. Fallback to window.ethereum (MetaMask, etc.)
  const ethereum = (window as any).ethereum
  if (ethereum) {
    console.log('🦊 Using browser wallet provider')
    return ethereum
  }

  throw new Error('No wallet provider available. Please install a wallet or open in Warpcast/Base App.')
}

/**
 * Get connected wallet address
 */
export async function getWalletAddress(): Promise<string> {
  const provider = await getEthereumProvider()
  
  // Request accounts
  const accounts = await provider.request({ method: 'eth_requestAccounts' })
  
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts available')
  }
  
  return accounts[0]
}

/**
 * Send transaction using the available provider
 */
export async function sendTransaction(params: {
  to: string
  data?: string
  value?: string
}): Promise<string> {
  const provider = await getEthereumProvider()
  const from = await getWalletAddress()
  
  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [{
      from,
      to: params.to,
      data: params.data || '0x',
      value: params.value || '0x0'
    }]
  })
  
  return txHash
}
