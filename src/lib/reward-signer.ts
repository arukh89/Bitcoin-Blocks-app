/**
 * Shared reward signing utilities
 * Consolidates EIP-712 signing logic used across claim endpoints
 */
import { encodeFunctionData, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { RewardClaimerAbi } from '@/lib/abis/rewardClaimer'

export type ClaimMessage = {
  roundId: bigint
  fid: bigint
  recipient: `0x${string}`
  amount: bigint
  prizeType: number
  nonce: bigint
  expiry: bigint
}

export type SignedClaim = {
  signature: Hex
  claim: {
    roundId: string
    fid: string
    recipient: string
    amount: string
    prizeType: number
    nonce: string
    expiry: string
  }
  domain: {
    name: string
    version: string
    chainId: number
    verifyingContract: `0x${string}`
  }
  tx: {
    to: string
    data: Hex
    chainId: number
  }
}

const EIP712_TYPES = {
  Claim: [
    { name: 'roundId', type: 'uint256' },
    { name: 'fid', type: 'uint256' },
    { name: 'recipient', type: 'address' },
    { name: 'amount', type: 'uint256' },
    { name: 'prizeType', type: 'uint8' },
    { name: 'nonce', type: 'uint256' },
    { name: 'expiry', type: 'uint256' },
  ],
} as const

/**
 * Generate nonce for claim signature
 */
export function generateNonce(): bigint {
  return BigInt(BigInt(Date.now()) ^ BigInt(Math.floor(Math.random() * 1e9)))
}

/**
 * Generate expiry timestamp (1 hour from now)
 */
export function generateExpiry(): bigint {
  const now = Math.floor(Date.now() / 1000)
  return BigInt(now + 60 * 60)
}

/**
 * Sign a reward claim using EIP-712
 */
export async function signRewardClaim(
  message: ClaimMessage,
  contractAddress: string,
  chainId: number,
  privateKey: string
): Promise<SignedClaim> {
  const domain = {
    name: 'RewardClaimer',
    version: '1',
    chainId,
    verifyingContract: contractAddress as `0x${string}`,
  }

  const account = privateKeyToAccount(privateKey as Hex)
  const signature = await account.signTypedData({
    domain,
    types: EIP712_TYPES,
    primaryType: 'Claim',
    message,
  })

  const data = encodeFunctionData({
    abi: RewardClaimerAbi,
    functionName: 'claim',
    args: [
      message.roundId,
      message.fid,
      message.recipient,
      message.amount,
      message.prizeType,
      message.nonce,
      message.expiry,
      signature,
    ],
  })

  return {
    signature,
    claim: {
      roundId: message.roundId.toString(),
      fid: message.fid.toString(),
      recipient: message.recipient,
      amount: message.amount.toString(),
      prizeType: message.prizeType,
      nonce: message.nonce.toString(),
      expiry: message.expiry.toString(),
    },
    domain,
    tx: { to: contractAddress, data, chainId },
  }
}
