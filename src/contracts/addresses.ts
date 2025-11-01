/**
 * Smart Contract Addresses Configuration
 * Centralized configuration for all deployed contracts on AndeChain
 * 
 * Production-ready with:
 * - Environment-based configuration
 * - Address validation
 * - Type safety
 * - Deployment tracking
 */

import { Address, isAddress } from 'viem';

// ==========================================
// TYPES
// ==========================================

export interface ContractConfig {
  address: Address;
  deployedAt?: number; // Block number
  deploymentTx?: string;
  version?: string;
  verified?: boolean;
}

export interface ContractAddresses {
  ANDEToken: Address;
  AndeGovernor: Address;
  AndeSequencerRegistry: Address;
  WAndeVault: Address;
  AndeNativeStaking?: Address;
  AndeStaking?: Address;
  AndeDEX?: Address;
  AndeBridge?: Address;
  [key: string]: Address | undefined;
}

// ==========================================
// CONSTANTS
// ==========================================

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// ==========================================
// CHAIN IDS
// ==========================================

export const CHAIN_IDS = {
  TESTNET: 6174,    // Production testnet (EVOLVE + Celestia Mocha-4)
  MAINNET: 9999,    // Future mainnet (TBD - placeholder to avoid conflict with testnet)
} as const;

// ==========================================
// CONTRACT ADDRESSES BY CHAIN ID
// ==========================================

/**
 * AndeChain Testnet (chainId 6174)
 * Production testnet with EVOLVE + Celestia Mocha-4
 * Deployed contracts on AndeChain Testnet
 * 
 * Contract Addresses (Production Testnet):
 * - ANDE Token (Token Duality): 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707
 * - AndeGovernor: 0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e
 * - AndeNativeStaking: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
 * - AndeTimelockController: 0x8A791620dd6260079BF849Dc5567aDC3F2FdC318
 */
const TESTNET_CONTRACTS: ContractAddresses = {
  ANDEToken: '0x5FC8d32690cc91D4c39d9d3abcBD16989F875707' as Address, // Token Duality implementation
  AndeGovernor: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e' as Address, // Dual Token Voting Governance
  AndeSequencerRegistry: ZERO_ADDRESS, // Not deployed yet
  AndeNativeStaking: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as Address, // 3-tier staking (Liquidity, Governance, Sequencer)
  WAndeVault: ZERO_ADDRESS, // Not deployed yet
};

// Remove duplicate - using the consolidated TESTNET_CONTRACTS above

/**
 * AndeChain Mainnet (chainId TBD)
 * Future production mainnet
 */
const MAINNET_CONTRACTS: ContractAddresses = {
  ANDEToken: (process.env.NEXT_PUBLIC_ANDE_TOKEN_ADDRESS || ZERO_ADDRESS) as Address,
  AndeGovernor: (process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || ZERO_ADDRESS) as Address,
  AndeSequencerRegistry: (process.env.NEXT_PUBLIC_SEQUENCER_REGISTRY_ADDRESS || ZERO_ADDRESS) as Address,
  WAndeVault: (process.env.NEXT_PUBLIC_WANDE_VAULT_ADDRESS || ZERO_ADDRESS) as Address,
  AndeNativeStaking: (process.env.NEXT_PUBLIC_ANDE_NATIVE_STAKING_ADDRESS || ZERO_ADDRESS) as Address,
};

// ==========================================
// DETAILED CONTRACT CONFIGS (Optional)
// ==========================================

export const CONTRACT_CONFIGS: Record<string, Partial<ContractConfig>> = {
  ANDEToken: {
    version: '1.0.0',
    verified: false,
    deployedAt: 1014,
  },
  AndeGovernor: {
    version: '1.0.0',
    verified: false,
    deployedAt: 1800,
  },
  AndeNativeStaking: {
    version: '1.0.0',
    verified: false,
    deployedAt: 1015,
  },
  AndeSequencerRegistry: {
    version: '1.0.0',
    verified: false,
  },
  WAndeVault: {
    version: '1.0.0',
    verified: false,
  },
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Get contracts by chain ID
 * Supports multiple chain configurations
 */
function getContractsByChainId(chainId?: number): ContractAddresses {
  // If chainId is provided, use it directly
  if (chainId) {
    switch (chainId) {
      case CHAIN_IDS.TESTNET:
        return TESTNET_CONTRACTS;
      case CHAIN_IDS.MAINNET:
        return MAINNET_CONTRACTS;
      default:
        console.warn(`Unknown chainId ${chainId}, falling back to testnet`);
        return TESTNET_CONTRACTS;
    }
  }

  // Otherwise, use environment variables
  const useProduction = process.env.NEXT_PUBLIC_USE_PRODUCTION === 'true';

  if (useProduction) {
    return MAINNET_CONTRACTS;
  }

  // Default to testnet (EVOLVE + Celestia)
  return TESTNET_CONTRACTS;
}

/**
 * Legacy function for backwards compatibility
 */
function getContractsByEnvironment(): ContractAddresses {
  return getContractsByChainId();
}

/**
 * Validates if a contract address is deployed (not zero address)
 */
export function isContractDeployed(address: Address): boolean {
  return address !== ZERO_ADDRESS && isAddress(address);
}

/**
 * Gets contract address with validation
 * Optionally specify chainId to get address for specific chain
 */
export function getContractAddress(
  contractName: keyof ContractAddresses,
  chainId?: number
): Address | null {
  const contracts = chainId ? getContractsByChainId(chainId) : ANDECHAIN_CONTRACTS;
  const address = contracts[contractName];
  
  if (!address) {
    console.warn(`Contract ${contractName} not found in configuration for chainId ${chainId || 'current'}`);
    return null;
  }

  if (!isContractDeployed(address)) {
    console.warn(`Contract ${contractName} is not deployed (zero address) on chainId ${chainId || 'current'}`);
    return null;
  }

  return address;
}

/**
 * Get all contract addresses for a specific chain
 */
export function getContractsForChain(chainId: number): ContractAddresses {
  return getContractsByChainId(chainId);
}

/**
 * Gets contract configuration
 */
export function getContractConfig(contractName: string): ContractConfig | null {
  const address = ANDECHAIN_CONTRACTS[contractName as keyof ContractAddresses];
  
  if (!address || !isContractDeployed(address)) {
    return null;
  }

  return {
    address,
    ...CONTRACT_CONFIGS[contractName],
  };
}

/**
 * Lists all deployed contracts
 */
export function getDeployedContracts(): Array<{
  name: string;
  address: Address;
  config?: Partial<ContractConfig>;
}> {
  return Object.entries(ANDECHAIN_CONTRACTS)
    .filter(([_, address]) => address && isContractDeployed(address))
    .map(([name, address]) => ({
      name,
      address: address as Address,
      config: CONTRACT_CONFIGS[name],
    }));
}

/**
 * Validates all contract addresses
 */
export function validateContractAddresses(): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  Object.entries(ANDECHAIN_CONTRACTS).forEach(([name, address]) => {
    if (!address) {
      errors.push(`${name}: Address is undefined`);
      return;
    }

    if (!isAddress(address)) {
      errors.push(`${name}: Invalid address format (${address})`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ==========================================
// EXPORTS
// ==========================================

/**
 * Main contract addresses object
 * Use this for all contract interactions
 */
export const ANDECHAIN_CONTRACTS = getContractsByEnvironment();

/**
 * Contract names enum for type safety
 */
export enum ContractName {
  ANDEToken = 'ANDEToken',
  AndeGovernor = 'AndeGovernor',
  AndeSequencerRegistry = 'AndeSequencerRegistry',
  WAndeVault = 'WAndeVault',
}

/**
 * Precompile addresses (native to the chain)
 */
export const PRECOMPILES = {
  ANDE_NATIVE: '0x00000000000000000000000000000000000000FD' as Address,
} as const;

// ==========================================
// DEVELOPMENT HELPERS
// ==========================================

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const currentChainId = CHAIN_IDS.TESTNET;

  // Log contract addresses in development
  console.group(`🔗 AndeChain Contract Addresses (chainId: ${currentChainId})`);
  Object.entries(ANDECHAIN_CONTRACTS).forEach(([name, address]) => {
    const deployed = address ? isContractDeployed(address) : false;
    const config = CONTRACT_CONFIGS[name];
    const blockInfo = config?.deployedAt ? ` (block ${config.deployedAt})` : '';
    console.log(
      `${name}: ${address || 'N/A'} ${deployed ? '✅' : '❌ (not deployed)'}${blockInfo}`
    );
  });
  console.groupEnd();

  // Validate addresses
  const validation = validateContractAddresses();
  if (!validation.valid) {
    console.warn('⚠️ Contract address validation errors:', validation.errors);
  }

  // Log all available chains
  console.group('🌐 Available Chain Configurations');
  // Local development removed - using unified testnet configuration
  console.log(`Testnet (${CHAIN_IDS.TESTNET}):`, TESTNET_CONTRACTS);
  console.log(`Mainnet (${CHAIN_IDS.MAINNET}):`, MAINNET_CONTRACTS);
  console.groupEnd();

  // Expose to window for debugging
  (window as any).__ANDECHAIN_CONTRACTS = {
    currentChainId,
    addresses: ANDECHAIN_CONTRACTS,
    configs: CONTRACT_CONFIGS,
    deployed: getDeployedContracts(),
    validation,
    allChains: {
      [CHAIN_IDS.TESTNET]: TESTNET_CONTRACTS,
      [CHAIN_IDS.MAINNET]: MAINNET_CONTRACTS,
    },
    getContractsForChain,
  };
}

// ==========================================
// CONVENIENCE EXPORTS
// ==========================================

/**
 * Individual contract address exports for direct import
 * Usage: import { ANDE_TOKEN_ADDRESS } from '@/contracts/addresses'
 */
export const ANDE_TOKEN_ADDRESS = ANDECHAIN_CONTRACTS.ANDEToken;
export const ANDE_GOVERNOR_ADDRESS = ANDECHAIN_CONTRACTS.AndeGovernor;
export const ANDE_NATIVE_STAKING_ADDRESS = ANDECHAIN_CONTRACTS.AndeNativeStaking || ZERO_ADDRESS;
export const ANDE_SEQUENCER_REGISTRY_ADDRESS = ANDECHAIN_CONTRACTS.AndeSequencerRegistry;
export const WANDE_VAULT_ADDRESS = ANDECHAIN_CONTRACTS.WAndeVault;
export const ANDE_STAKING_ADDRESS = ANDECHAIN_CONTRACTS.AndeStaking || ZERO_ADDRESS;
export const ANDE_DEX_ADDRESS = ANDECHAIN_CONTRACTS.AndeDEX || ZERO_ADDRESS;
export const ANDE_BRIDGE_ADDRESS = ANDECHAIN_CONTRACTS.AndeBridge || ZERO_ADDRESS;

/**
 * Timelock Controller Address
 * Controls governance proposal execution with 1 hour delay
 */
export const ANDE_TIMELOCK_ADDRESS = '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318' as Address;

/**
 * Precompile Addresses
 * Native system contracts
 */
export const ANDE_NATIVE_PRECOMPILE = '0x00000000000000000000000000000000000000FD' as Address;