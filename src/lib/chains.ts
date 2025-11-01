import { defineChain } from 'viem'

/**
 * Environment-based configuration helpers
 * These functions provide dynamic RPC and service URLs based on deployment environment
 */

// Get environment (development, staging, production)
const getEnv = () => {
  return process.env.NEXT_PUBLIC_ENV || 'development';
};

// Get RPC HTTP URL based on environment
const getRpcHttp = () => {
  const env = getEnv();
  
  // Always use the actual RPC endpoint from environment or default
  // MetaMask requires full HTTPS URLs, not relative paths
  if (env === 'production') {
    return process.env.NEXT_PUBLIC_RPC_HTTP || 'http://189.28.81.202:8545';
  }
  
  // Development: use local RPC endpoint
  return process.env.NEXT_PUBLIC_LOCAL_RPC_HTTP || 'http://localhost:8545';
};

// Get RPC WebSocket URL based on environment
const getRpcWs = () => {
  const env = getEnv();
  // WebSocket always uses the environment variable or default
  if (env === 'production') {
    return process.env.NEXT_PUBLIC_RPC_WS || 'ws://189.28.81.202:8546';
  }
  return process.env.NEXT_PUBLIC_LOCAL_RPC_WS || 'ws://localhost:8546';
};

// Get explorer URL from env or use default
const getExplorerUrl = () => {
  const env = getEnv();
  if (env === 'production') {
    return process.env.NEXT_PUBLIC_EXPLORER_URL || 'https://explorer.andelabs.io';
  }
  if (typeof window !== 'undefined') {
    // Try to detect if Blockscout is running on port 4000
    return 'http://localhost:4000';
  }
  return process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://localhost:4000';
};

// Get chain ID from env
const getChainId = (): number => {
  const chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
  return chainId ? parseInt(chainId, 10) : 6174;
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
 * 
 * RPC endpoints are dynamically configured based on NEXT_PUBLIC_ENV:
 * - development: localhost:8545
 * - production: Public RPC (IP or domain)
 */
export const andechainTestnet = defineChain({
  id: getChainId(),
  name: process.env.NEXT_PUBLIC_NETWORK_NAME || 'AndeChain Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'ANDE',
    symbol: 'ANDE',
  },
  rpcUrls: {
    default: { 
      http: [getRpcHttp()],
      webSocket: [getRpcWs()],
    },
    public: { 
      http: [getRpcHttp()],
      webSocket: [getRpcWs()],
    },
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

/**
 * Get current network configuration
 */
export function getNetworkConfig() {
  return {
    environment: getEnv(),
    chainId: getChainId(),
    rpcHttp: getRpcHttp(),
    rpcWs: getRpcWs(),
    explorer: getExplorerUrl(),
    isProduction: getEnv() === 'production',
    isDevelopment: getEnv() === 'development',
  };
}

/**
 * Export configuration URLs for easy access
 */
export const andeUrls = {
  rpc: {
    http: getRpcHttp(),
    ws: getRpcWs(),
  },
  explorer: getExplorerUrl(),
  docs: process.env.NEXT_PUBLIC_DOCS_URL || 'https://docs.andelabs.io',
  faucet: process.env.NEXT_PUBLIC_FAUCET_URL || 'http://localhost:3001',
  grafana: process.env.NEXT_PUBLIC_GRAFANA_URL || 'http://localhost:3000',
  prometheus: process.env.NEXT_PUBLIC_PROMETHEUS_URL || 'http://localhost:9090',
  celestiaExplorer: process.env.NEXT_PUBLIC_CELESTIA_EXPLORER || 'https://mocha-4.celenium.io',
  support: process.env.NEXT_PUBLIC_SUPPORT_URL || 'https://discord.gg/andelabs',
};

/**
 * Network information for display
 */
export const andeNetworkInfo = {
  name: process.env.NEXT_PUBLIC_NETWORK_NAME || 'AndeChain Testnet',
  chainId: getChainId(),
  symbol: 'ANDE',
  decimals: 18,
  blockTime: 2, // seconds
  consensus: 'Evolve Sequencer',
  dataAvailability: 'Celestia Mocha-4',
  executionLayer: 'EV-Reth (Modified Reth)',
  features: [
    'Token Duality (Native + ERC20)',
    'Parallel EVM Execution',
    'MEV Detection & Capture',
    'Adaptive Lazy Mode (1s/5s blocks)',
    'Celestia DA Integration',
  ],
};