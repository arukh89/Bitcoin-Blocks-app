import 'client-only'
import { createConfig, http } from 'wagmi'
import { base, arbitrum } from 'wagmi/chains'
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base, arbitrum],
  connectors: [
    metaMask(),
    coinbaseWallet({ appName: 'Bitcoin Blocks' }),
    injected(),
  ],
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http(),
  },
})
