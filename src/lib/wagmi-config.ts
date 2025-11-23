import 'client-only'
import { createConfig, http } from 'wagmi'
import { base, arbitrum } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [base, arbitrum],
  connectors: [injected()],
  transports: {
    [base.id]: http(),
    [arbitrum.id]: http()
  }
})
