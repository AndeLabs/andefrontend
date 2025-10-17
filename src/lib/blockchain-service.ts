/**
 * Blockchain Service
 * Centralized service for all blockchain interactions
 * Provides type-safe, cacheable, and optimized access to smart contracts
 */

import { PublicClient, WalletClient, parseEther, formatEther, Address, Hash } from 'viem';
import { andechain } from './chains';
import { ANDECHAIN_CONTRACTS } from '@/contracts/addresses';
import ANDETokenABI from '@/contracts/abis/ANDEToken.json';
import AndeGovernorABI from '@/contracts/abis/AndeGovernor.json';
import AndeSequencerRegistryABI from '@/contracts/abis/AndeSequencerRegistry.json';

// ==========================================
// TYPES
// ==========================================

export interface TokenBalance {
  value: bigint;
  formatted: string;
  decimals: number;
  symbol: string;
}

export interface Transaction {
  hash: Hash;
  from: Address;
  to: Address | null;
  value: bigint;
  gasPrice?: bigint;
  gasUsed?: bigint;
  blockNumber?: bigint;
  timestamp?: number;
  status?: 'success' | 'failed' | 'pending';
}

export interface Proposal {
  id: number;
  proposer: Address;
  targets: Address[];
  values: bigint[];
  signatures: string[];
  calldatas: string[];
  startBlock: bigint;
  endBlock: bigint;
  description: string;
  forVotes: bigint;
  againstVotes: bigint;
  abstainVotes: bigint;
  canceled: boolean;
  executed: boolean;
}

export interface StakePosition {
  amount: bigint;
  startTime: bigint;
  unlockTime: bigint;
  rewards: bigint;
  isActive: boolean;
}

// ==========================================
// BLOCKCHAIN SERVICE CLASS
// ==========================================

export class BlockchainService {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;

  constructor(publicClient: PublicClient, walletClient?: WalletClient) {
    this.publicClient = publicClient;
    this.walletClient = walletClient;
  }

  // ==========================================
  // NETWORK & BLOCKS
  // ==========================================

  async getBlockNumber(): Promise<bigint> {
    try {
      return await this.publicClient.getBlockNumber();
    } catch (error) {
      console.error('Error getting block number:', error);
      throw error;
    }
  }

  async getBlock(blockNumber?: bigint) {
    try {
      return await this.publicClient.getBlock({
        blockNumber,
        includeTransactions: true,
      });
    } catch (error) {
      console.error('Error getting block:', error);
      throw error;
    }
  }

  async getTransaction(hash: Hash): Promise<Transaction> {
    try {
      const tx = await this.publicClient.getTransaction({ hash });
      const receipt = await this.publicClient.getTransactionReceipt({ hash });

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        gasPrice: tx.gasPrice,
        gasUsed: receipt.gasUsed,
        blockNumber: tx.blockNumber,
        status: receipt.status === 'success' ? 'success' : 'failed',
      };
    } catch (error) {
      console.error('Error getting transaction:', error);
      throw error;
    }
  }

  async getRecentTransactions(count: number = 10): Promise<Transaction[]> {
    try {
      const currentBlock = await this.getBlockNumber();
      const transactions: Transaction[] = [];

      for (let i = 0; i < Math.min(count, 5); i++) {
        const blockNumber = currentBlock - BigInt(i);
        if (blockNumber < 0) break;

        const block = await this.getBlock(blockNumber);
        
        for (const tx of block.transactions) {
          if (typeof tx === 'object') {
            transactions.push({
              hash: tx.hash,
              from: tx.from,
              to: tx.to,
              value: tx.value,
              gasPrice: tx.gasPrice,
              blockNumber: block.number,
              timestamp: Number(block.timestamp),
              status: 'success',
            });

            if (transactions.length >= count) break;
          }
        }

        if (transactions.length >= count) break;
      }

      return transactions;
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }

  // ==========================================
  // NATIVE BALANCE
  // ==========================================

  async getNativeBalance(address: Address): Promise<TokenBalance> {
    try {
      const balance = await this.publicClient.getBalance({ address });
      return {
        value: balance,
        formatted: formatEther(balance),
        decimals: 18,
        symbol: 'ANDE',
      };
    } catch (error) {
      console.error('Error getting native balance:', error);
      throw error;
    }
  }

  // ==========================================
  // ANDE TOKEN
  // ==========================================

  async getTokenBalance(address: Address): Promise<TokenBalance> {
    try {
      const balance = await this.publicClient.readContract({
        address: ANDECHAIN_CONTRACTS.ANDEToken as Address,
        abi: ANDETokenABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;

      return {
        value: balance,
        formatted: formatEther(balance),
        decimals: 18,
        symbol: 'ANDE',
      };
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw error;
    }
  }

  async getTokenTotalSupply(): Promise<bigint> {
    try {
      return await this.publicClient.readContract({
        address: ANDECHAIN_CONTRACTS.ANDEToken as Address,
        abi: ANDETokenABI,
        functionName: 'totalSupply',
      }) as bigint;
    } catch (error) {
      console.error('Error getting total supply:', error);
      throw error;
    }
  }

  async transferToken(to: Address, amount: string): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: ANDECHAIN_CONTRACTS.ANDEToken as Address,
        abi: ANDETokenABI,
        functionName: 'transfer',
        args: [to, parseEther(amount)],
      });

      return hash;
    } catch (error) {
      console.error('Error transferring token:', error);
      throw error;
    }
  }

  // ==========================================
  // TRANSACTIONS
  // ==========================================

  async sendTransaction(
    to: Address,
    value: string,
    data?: `0x${string}`
  ): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const account = this.walletClient.account;
      if (!account) {
        throw new Error('No account found');
      }

      const hash = await this.walletClient.sendTransaction({
        account,
        to,
        value: parseEther(value),
        data,
        chain: andechain,
      });

      return hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  async waitForTransaction(hash: Hash) {
    try {
      return await this.publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000, // 60 seconds
      });
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  // ==========================================
  // GOVERNANCE
  // ==========================================

  async getProposal(proposalId: bigint): Promise<Proposal | null> {
    try {
      if (ANDECHAIN_CONTRACTS.AndeGovernor === '0x0000000000000000000000000000000000000000') {
        return null; // Governance not deployed yet
      }

      const proposal = await this.publicClient.readContract({
        address: ANDECHAIN_CONTRACTS.AndeGovernor as Address,
        abi: AndeGovernorABI,
        functionName: 'proposals',
        args: [proposalId],
      }) as any;

      return proposal;
    } catch (error) {
      console.error('Error getting proposal:', error);
      return null;
    }
  }

  async castVote(proposalId: bigint, support: 0 | 1 | 2): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    if (ANDECHAIN_CONTRACTS.AndeGovernor === '0x0000000000000000000000000000000000000000') {
      throw new Error('Governance contract not deployed');
    }

    try {
      const hash = await this.walletClient.writeContract({
        address: ANDECHAIN_CONTRACTS.AndeGovernor as Address,
        abi: AndeGovernorABI,
        functionName: 'castVote',
        args: [proposalId, support],
      });

      return hash;
    } catch (error) {
      console.error('Error casting vote:', error);
      throw error;
    }
  }

  // ==========================================
  // SMART CONTRACT DEPLOYMENT
  // ==========================================

  async deployContract(
    bytecode: `0x${string}`,
    abi: any[],
    args?: any[]
  ): Promise<{ hash: Hash; address?: Address }> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const account = this.walletClient.account;
      if (!account) {
        throw new Error('No account found');
      }

      const hash = await this.walletClient.deployContract({
        abi,
        bytecode,
        args,
        account,
        chain: andechain,
      });

      // Wait for deployment
      const receipt = await this.waitForTransaction(hash);

      return {
        hash,
        address: receipt.contractAddress || undefined,
      };
    } catch (error) {
      console.error('Error deploying contract:', error);
      throw error;
    }
  }

  // ==========================================
  // SMART CONTRACT INTERACTION
  // ==========================================

  async readContract(
    address: Address,
    abi: any[],
    functionName: string,
    args?: any[]
  ): Promise<any> {
    try {
      return await this.publicClient.readContract({
        address,
        abi,
        functionName,
        args,
      });
    } catch (error) {
      console.error(`Error reading contract ${functionName}:`, error);
      throw error;
    }
  }

  async writeContract(
    address: Address,
    abi: any[],
    functionName: string,
    args?: any[]
  ): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected');
    }

    try {
      const hash = await this.walletClient.writeContract({
        address,
        abi,
        functionName,
        args,
        chain: andechain,
      });

      return hash;
    } catch (error) {
      console.error(`Error writing contract ${functionName}:`, error);
      throw error;
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  async estimateGas(
    to: Address,
    value?: bigint,
    data?: `0x${string}`
  ): Promise<bigint> {
    try {
      const account = this.walletClient?.account;
      if (!account) {
        throw new Error('No account found');
      }

      return await this.publicClient.estimateGas({
        account,
        to,
        value,
        data,
      });
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw error;
    }
  }

  async getGasPrice(): Promise<bigint> {
    try {
      return await this.publicClient.getGasPrice();
    } catch (error) {
      console.error('Error getting gas price:', error);
      throw error;
    }
  }
}

// ==========================================
// SINGLETON INSTANCE (Optional)
// ==========================================

let blockchainServiceInstance: BlockchainService | null = null;

export function createBlockchainService(
  publicClient: PublicClient,
  walletClient?: WalletClient
): BlockchainService {
  blockchainServiceInstance = new BlockchainService(publicClient, walletClient);
  return blockchainServiceInstance;
}

export function getBlockchainService(): BlockchainService {
  if (!blockchainServiceInstance) {
    throw new Error('BlockchainService not initialized. Call createBlockchainService first.');
  }
  return blockchainServiceInstance;
}