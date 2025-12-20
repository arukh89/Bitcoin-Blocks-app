// Contract addresses and ABIs for Bitcoin Blocks

// Base Sepolia (Testnet)
export const BASE_SEPOLIA_CONFIG = {
  chainId: 84532,
  tokenAddress: process.env.NEXT_PUBLIC_TEST_TOKEN_ADDRESS || '0x4042066D7C572Fc3c39278A55860356ad9D9dEad',
  claimContract: process.env.NEXT_PUBLIC_TEST_CLAIM_CONTRACT || '0x14001074CF45197B6553f702b83f4b2c32B47F3E',
  rpcUrl: 'https://sepolia.base.org',
  blockExplorer: 'https://sepolia.basescan.org',
};

// Base Mainnet (Production)
export const BASE_MAINNET_CONFIG = {
  chainId: 8453,
  tokenAddress: process.env.NEXT_PUBLIC_SECOND_TOKEN_ADDRESS || '0xCE9199A0C05446ceEd4F0F928c864b7a2f9F86B3',
  claimContract: process.env.NEXT_PUBLIC_CLAIM_CONTRACT || '0x5DCcC278a018498DEdaC123b0E8F14b528D29a00',
  rpcUrl: 'https://mainnet.base.org',
  blockExplorer: 'https://basescan.org',
};

// Use mainnet for production
export const ACTIVE_CONFIG = BASE_MAINNET_CONFIG;

// BitcoinBlocksClaim ABI (only functions we need)
export const CLAIM_CONTRACT_ABI = [
  {
    name: 'claim',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'roundId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'hasPrize',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roundId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: '', type: 'bool' },
      { name: '', type: 'uint256' },
    ],
  },
  {
    name: 'getPrize',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'roundId', type: 'bytes32' },
      { name: 'user', type: 'address' },
    ],
    outputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'claimed', type: 'bool' },
    ],
  },
  {
    name: 'setPrize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'roundId', type: 'bytes32' },
      { name: 'winner', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'getBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

// ERC20 ABI (only functions we need)
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
] as const;

// Helper to convert round ID (UUID) to bytes32
export function roundIdToBytes32(roundId: string): `0x${string}` {
  // Remove dashes from UUID and pad to 32 bytes
  const cleanId = roundId.replace(/-/g, '');
  return `0x${cleanId.padEnd(64, '0')}` as `0x${string}`;
}
