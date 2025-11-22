import 'client-only'
import { createConfig, http } from 'wagmi'
import { base, arbitrum } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// WalletConnect: enable only when env is provided; no hardcoded fallback
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID

const connectors = [
  injected(),
  coinbaseWallet({ appName: 'Bitcoin Blocks' }),
  ...(projectId ? [walletConnect({ projectId })] : []),
]

export const wagmiConfig = createConfig({
  chains: [base, arbitrum],
  connectors,
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http()
  }
})
