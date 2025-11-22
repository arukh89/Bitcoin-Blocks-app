import 'client-only'
import { createConfig, http } from 'wagmi'
import { base, arbitrum } from 'wagmi/chains'
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors'

// WalletConnect Project ID - get from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'YOUR_WALLETCONNECT_PROJECT_ID'

export const wagmiConfig = createConfig({
  chains: [base, arbitrum],
  connectors: [
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'Bitcoin Blocks' })
  ],
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http()
  }
})
