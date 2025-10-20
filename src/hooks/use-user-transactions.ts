'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { andechainTestnet as andechain } from '@/lib/chains';
import type { Address, Transaction, TransactionReceipt } from 'viem';

export interface UserTransaction {
  hash: string;
  from: Address;
  to: Address | null;
  value: bigint;
  blockNumber: bigint;
  timestamp: bigint;
  status: 'success' | 'failed' | 'pending';
  gasUsed?: bigint;
  gasPrice?: bigint;
  nonce: number;
  type: 'send' | 'receive' | 'contract';
}

interface UseUserTransactionsReturn {
  transactions: UserTransaction[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const MAX_BLOCKS_TO_SCAN = 1000;
const CACHE_KEY_PREFIX = 'ande_user_txs_';
const CACHE_DURATION = 60000; // 1 minute

export function useUserTransactions(limit = 10): UseUserTransactionsReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: andechain.id });
  
  const [transactions, setTransactions] = useState<UserTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load from cache
  const loadFromCache = useCallback((userAddress: Address): UserTransaction[] | null => {
    if (typeof window === 'undefined') return null;

    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${userAddress.toLowerCase()}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      
      // Check if cache is still valid
      if (Date.now() - timestamp > CACHE_DURATION) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      // Parse BigInt values
      return data.map((tx: any) => ({
        ...tx,
        value: BigInt(tx.value),
        blockNumber: BigInt(tx.blockNumber),
        timestamp: BigInt(tx.timestamp),
        gasUsed: tx.gasUsed ? BigInt(tx.gasUsed) : undefined,
        gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
      }));
    } catch (err) {
      console.error('Failed to load transactions from cache:', err);
      return null;
    }
  }, []);

  // Save to cache
  const saveToCache = useCallback((userAddress: Address, txs: UserTransaction[]) => {
    if (typeof window === 'undefined') return;

    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${userAddress.toLowerCase()}`;
      
      // Convert BigInt to string for storage
      const serializable = txs.map(tx => ({
        ...tx,
        value: tx.value.toString(),
        blockNumber: tx.blockNumber.toString(),
        timestamp: tx.timestamp.toString(),
        gasUsed: tx.gasUsed?.toString(),
        gasPrice: tx.gasPrice?.toString(),
      }));

      localStorage.setItem(cacheKey, JSON.stringify({
        data: serializable,
        timestamp: Date.now(),
      }));
    } catch (err) {
      console.error('Failed to save transactions to cache:', err);
    }
  }, []);

  // Fetch transactions from blockchain
  const fetchTransactions = useCallback(async () => {
    if (!address || !publicClient || !isConnected) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Try to load from cache first
      const cached = loadFromCache(address);
      if (cached && cached.length > 0) {
        setTransactions(cached);
        setIsLoading(false);
        return;
      }

      // Get current block number
      const currentBlock = await publicClient.getBlockNumber();
      const startBlock = currentBlock - BigInt(MAX_BLOCKS_TO_SCAN);

      const userTxs: UserTransaction[] = [];
      const processedHashes = new Set<string>();

      // Scan recent blocks for transactions
      const blocksToCheck = Math.min(Number(MAX_BLOCKS_TO_SCAN), Number(currentBlock));
      const batchSize = 10;

      for (let i = 0; i < blocksToCheck && userTxs.length < limit; i += batchSize) {
        const blockPromises = [];
        
        for (let j = 0; j < batchSize && i + j < blocksToCheck; j++) {
          const blockNum = currentBlock - BigInt(i + j);
          if (blockNum >= BigInt(0)) {
            blockPromises.push(
              publicClient.getBlock({ 
                blockNumber: blockNum,
                includeTransactions: true,
              }).catch(() => null)
            );
          }
        }

        const blocks = await Promise.all(blockPromises);

        for (const block of blocks) {
          if (!block || userTxs.length >= limit) break;

          for (const tx of block.transactions) {
            if (typeof tx === 'string') continue;

            const txHash = tx.hash;
            if (processedHashes.has(txHash)) continue;

            // Check if transaction involves the user
            const isFrom = tx.from.toLowerCase() === address.toLowerCase();
            const isTo = tx.to?.toLowerCase() === address.toLowerCase();

            if (isFrom || isTo) {
              processedHashes.add(txHash);

              // Get transaction receipt for status
              const receipt = await publicClient.getTransactionReceipt({ hash: txHash })
                .catch(() => null);

              const userTx: UserTransaction = {
                hash: txHash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                blockNumber: block.number!,
                timestamp: block.timestamp,
                status: receipt?.status === 'success' ? 'success' : 
                        receipt?.status === 'reverted' ? 'failed' : 'pending',
                gasUsed: receipt?.gasUsed,
                gasPrice: tx.gasPrice,
                nonce: tx.nonce,
                type: !tx.to ? 'contract' : isFrom ? 'send' : 'receive',
              };

              userTxs.push(userTx);

              if (userTxs.length >= limit) break;
            }
          }
        }
      }

      // Sort by block number descending
      userTxs.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      setTransactions(userTxs);
      
      // Save to cache
      if (userTxs.length > 0) {
        saveToCache(address, userTxs);
      }
    } catch (err) {
      console.error('Failed to fetch user transactions:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
    } finally {
      setIsLoading(false);
    }
  }, [address, publicClient, isConnected, limit, loadFromCache, saveToCache]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    if (isConnected && address) {
      fetchTransactions();
    } else {
      setTransactions([]);
      setIsLoading(false);
      setError(null);
    }
  }, [address, isConnected, fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}

/**
 * Hook to watch for new transactions in real-time
 */
export function useWatchUserTransactions() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: andechain.id });
  const [latestTx, setLatestTx] = useState<UserTransaction | null>(null);

  useEffect(() => {
    if (!address || !publicClient) return;

    const unwatch = publicClient.watchBlocks({
      onBlock: async (block) => {
        try {
          const fullBlock = await publicClient.getBlock({
            blockHash: block.hash!,
            includeTransactions: true,
          });

          for (const tx of fullBlock.transactions) {
            if (typeof tx === 'string') continue;

            const isFrom = tx.from.toLowerCase() === address.toLowerCase();
            const isTo = tx.to?.toLowerCase() === address.toLowerCase();

            if (isFrom || isTo) {
              const receipt = await publicClient.getTransactionReceipt({ hash: tx.hash })
                .catch(() => null);

              const userTx: UserTransaction = {
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                value: tx.value,
                blockNumber: fullBlock.number!,
                timestamp: fullBlock.timestamp,
                status: receipt?.status === 'success' ? 'success' : 
                        receipt?.status === 'reverted' ? 'failed' : 'pending',
                gasUsed: receipt?.gasUsed,
                gasPrice: tx.gasPrice,
                nonce: tx.nonce,
                type: !tx.to ? 'contract' : isFrom ? 'send' : 'receive',
              };

              setLatestTx(userTx);
              break;
            }
          }
        } catch (err) {
          console.error('Error watching transactions:', err);
        }
      },
    });

    return () => {
      unwatch();
    };
  }, [address, publicClient]);

  return { latestTx };
}