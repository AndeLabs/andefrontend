import { defineChain } from 'viem'

// Get explorer URL from env or use default
const getExplorerUrl = () => {
  if (typeof window !== 'undefined') {
    // Try to detect if Blockscout is running on port 4000
    return 'http://localhost:4000';
  }
  return process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://localhost:4000';
};

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

export const andechainTestnet = defineChain({
  id: 1234,
  name: 'AndeChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { http: ['https://testnet.andechain.com/rpc'] },
    public: { http: ['https://testnet.andechain.com/rpc'] },
  },
  blockExplorers: {
    default: { 
      name: 'AndeScan', 
      url: 'https://testnet.andescan.com',
    },
  },
  testnet: true,
})

// Use local chain by default in development
export const andechain = process.env.NEXT_PUBLIC_USE_LOCAL_CHAIN === 'true' 
  ? andechainLocal 
  : andechainLocal; // Default to local for now

// Export helper to check if explorer is available
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