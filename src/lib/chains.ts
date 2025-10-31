import { defineChain } from 'viem'

// Get explorer URL from env or use default
const getExplorerUrl = () => {
  if (typeof window !== 'undefined') {
    // Try to detect if Blockscout is running on port 4000
    return 'http://localhost:4000';
  }
  return process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://localhost:4000';
};

/**
 * AndeChain Local Development Chain
 * Uses chainId 1234 for local development with standalone ev-reth
 */
export const andechainLocal = defineChain({
  id: 1234,
  name: 'AndeChain Local',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
    public: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { 
      name: 'Blockscout', 
      url: getExplorerUrl(),
    },
  },
  testnet: true,
})

/**
 * AndeChain Production Testnet
 * Uses chainId 6174 with EVOLVE sequencer + Celestia Mocha-4 DA
 * This is the official production-ready testnet configuration
 */
export const andechainTestnet = defineChain({
  id: 6174,
  name: 'AndeChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { http: ['http://localhost:8545'] },
    public: { http: ['http://localhost:8545'] },
  },
  blockExplorers: {
    default: { 
      name: 'AndeScan', 
      url: getExplorerUrl(),
    },
  },
  testnet: true,
  contracts: {
    // Native precompiles
    andeNative: {
      address: '0x00000000000000000000000000000000000000FD',
    },
    // ANDE Token (Token Duality)
    andeToken: {
      address: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    },
  },
})

/**
 * AndeChain Production Mainnet (Future)
 * Uses chainId TBD with EVOLVE sequencer + Celestia Mainnet DA
 */
export const andechainMainnet = defineChain({
  id: 6174, // Will be changed for mainnet
  name: 'AndeChain',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.andechain.com'] },
    public: { http: ['https://rpc.andechain.com'] },
  },
  blockExplorers: {
    default: { 
      name: 'AndeScan', 
      url: 'https://andescan.com',
    },
  },
  testnet: false,
  contracts: {
    // Native precompiles
    andeNative: {
      address: '0x00000000000000000000000000000000000000FD',
    },
  },
})

/**
 * DEPRECATED: Do not use this export
 * 
 * This was causing issues because it's evaluated at build-time,
 * not runtime. Use `andechainTestnet` or `andechainLocal` directly,
 * or better yet, use `useChainId()` hook for dynamic chain detection.
 * 
 * @deprecated Use andechainTestnet or andechainLocal directly
 */
export const andechain = andechainTestnet;

/**
 * Export helper to check if explorer is available
 */
export const isExplorerAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  try {
    const response = await fetch('http://localhost:4000', { 
      method: 'HEAD',
      mode: 'no-cors',
    });
    return true;
  } catch {
    return false;
  }
};

/**
 * Export all chains for use in wallet configuration
 */
export const allAndeChains = [
  andechainLocal,
  andechainTestnet,
  andechainMainnet,
] as const;

/**
 * Get chain info by chainId
 */
export function getChainById(chainId: number) {
  switch (chainId) {
    case 1234:
      return andechainLocal;
    case 6174:
      return andechainTestnet;
    default:
      return null;
  }
}

/**
 * Check if chainId is a valid AndeChain
 */
export function isAndeChain(chainId: number): boolean {
  return chainId === 1234 || chainId === 6174;
}