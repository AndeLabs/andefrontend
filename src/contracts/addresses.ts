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
  AndeStaking?: Address;
  AndeDEX?: Address;
  AndeBridge?: Address;
  [key: string]: Address | undefined;
}

// ==========================================
// CONSTANTS
// ==========================================

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as Address;

// ==========================================
// CONTRACT ADDRESSES BY ENVIRONMENT
// ==========================================

const LOCAL_CONTRACTS: ContractAddresses = {
  ANDEToken: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853' as Address,
  AndeGovernor: ZERO_ADDRESS,
  AndeSequencerRegistry: ZERO_ADDRESS,
  WAndeVault: ZERO_ADDRESS,
};

const TESTNET_CONTRACTS: ContractAddresses = {
  ANDEToken: (process.env.NEXT_PUBLIC_ANDE_TOKEN_ADDRESS || ZERO_ADDRESS) as Address,
  AndeGovernor: (process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || ZERO_ADDRESS) as Address,
  AndeSequencerRegistry: ZERO_ADDRESS,
  WAndeVault: ZERO_ADDRESS,
};

const MAINNET_CONTRACTS: ContractAddresses = {
  ANDEToken: (process.env.NEXT_PUBLIC_ANDE_TOKEN_ADDRESS || ZERO_ADDRESS) as Address,
  AndeGovernor: (process.env.NEXT_PUBLIC_GOVERNANCE_ADDRESS || ZERO_ADDRESS) as Address,
  AndeSequencerRegistry: (process.env.NEXT_PUBLIC_SEQUENCER_REGISTRY_ADDRESS || ZERO_ADDRESS) as Address,
  WAndeVault: (process.env.NEXT_PUBLIC_WANDE_VAULT_ADDRESS || ZERO_ADDRESS) as Address,
};

// ==========================================
// DETAILED CONTRACT CONFIGS (Optional)
// ==========================================

export const CONTRACT_CONFIGS: Record<string, Partial<ContractConfig>> = {
  ANDEToken: {
    version: '1.0.0',
    verified: true,
  },
  AndeGovernor: {
    version: '1.0.0',
    verified: false,
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

function getContractsByEnvironment(): ContractAddresses {
  const useLocal = process.env.NEXT_PUBLIC_USE_LOCAL_CHAIN === 'true';
  const isProduction = process.env.NODE_ENV === 'production';

  if (useLocal) {
    return LOCAL_CONTRACTS;
  }

  if (isProduction) {
    return MAINNET_CONTRACTS;
  }

  return TESTNET_CONTRACTS;
}

/**
 * Validates if a contract address is deployed (not zero address)
 */
export function isContractDeployed(address: Address): boolean {
  return address !== ZERO_ADDRESS && isAddress(address);
}

/**
 * Gets contract address with validation
 */
export function getContractAddress(contractName: keyof ContractAddresses): Address | null {
  const address = ANDECHAIN_CONTRACTS[contractName];
  
  if (!address) {
    console.warn(`Contract ${contractName} not found in configuration`);
    return null;
  }

  if (!isContractDeployed(address)) {
    console.warn(`Contract ${contractName} is not deployed (zero address)`);
    return null;
  }

  return address;
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
  // Log contract addresses in development
  console.group('🔗 AndeChain Contract Addresses');
  Object.entries(ANDECHAIN_CONTRACTS).forEach(([name, address]) => {
    const deployed = isContractDeployed(address);
    console.log(
      `${name}: ${address} ${deployed ? '✅' : '❌ (not deployed)'}`
    );
  });
  console.groupEnd();

  // Validate addresses
  const validation = validateContractAddresses();
  if (!validation.valid) {
    console.warn('⚠️ Contract address validation errors:', validation.errors);
  }

  // Expose to window for debugging
  (window as any).__ANDECHAIN_CONTRACTS = {
    addresses: ANDECHAIN_CONTRACTS,
    configs: CONTRACT_CONFIGS,
    deployed: getDeployedContracts(),
    validation,
  };
}