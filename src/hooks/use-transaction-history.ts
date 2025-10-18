'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAccount, usePublicClient, useBlockNumber } from 'wagmi';
import { formatEther, type Address, type Hash } from 'viem';
import { andechain } from '@/lib/chains';

export interface TransactionDetailed {
  hash: Hash;
  from: Address;
  to: Address | null;
  value: bigint;
  valueFormatted: string;
  gasPrice: bigint;
  gasPriceGwei: string;
  gasUsed?: bigint;
  status: 'pending' | 'success' | 'failed';
  timestamp: number;
  blockNumber?: bigint;
  blockHash?: Hash;
  nonce?: number;
  input?: string;
  type?: 'send' | 'receive' | 'contract';
  tokenSymbol?: string;
}

const STORAGE_KEY_PREFIX = 'ande_tx_history_';
const MAX_STORED_TXS = 100;
const BLOCKS_TO_SCAN = 100;

export function useTransactionHistory() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: andechain.id });
  const { data: currentBlock } = useBlockNumber({ 
    watch: true, 
    chainId: andechain.id,
  });

  const [transactions, setTransactions] = useState<TransactionDetailed[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load transactions from localStorage
  const loadStoredTransactions = useCallback((): TransactionDetailed[] => {
    if (typeof window === 'undefined' || !address) return [];
    
    try {
      const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
      const stored = localStorage.getItem(key);
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed.map(tx => ({
        ...tx,
        value: BigInt(tx.value),
        gasPrice: BigInt(tx.gasPrice),
        gasUsed: tx.gasUsed ? BigInt(tx.gasUsed) : undefined,
        blockNumber: tx.blockNumber ? BigInt(tx.blockNumber) : undefined,
      })) : [];
    } catch (error) {
      console.error('Error loading stored transactions:', error);
      return [];
    }
  }, [address]);

  // Save transactions to localStorage
  const saveTransactions = useCallback((txs: TransactionDetailed[]) => {
    if (typeof window === 'undefined' || !address) return;

    try {
      const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
      // Convert BigInt to string for storage
      const serializable = txs.slice(0, MAX_STORED_TXS).map(tx => ({
        ...tx,
        value: tx.value.toString(),
        gasPrice: tx.gasPrice.toString(),
        gasUsed: tx.gasUsed?.toString(),
        blockNumber: tx.blockNumber?.toString(),
      }));
      localStorage.setItem(key, JSON.stringify(serializable));
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }, [address]);

  // Convert transaction to detailed format
  const formatTransaction = useCallback(
    (tx: any, timestamp: number, status: 'pending' | 'success' | 'failed'): TransactionDetailed => {
      const isReceive = tx.to?.toLowerCase() === address?.toLowerCase();
      const isSend = tx.from?.toLowerCase() === address?.toLowerCase();
      const isContract = tx.to === null;

      let type: 'send' | 'receive' | 'contract' = 'send';
      if (isContract) type = 'contract';
      else if (isReceive && !isSend) type = 'receive';

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: tx.value,
        valueFormatted: formatEther(tx.value),
        gasPrice: tx.gasPrice || BigInt(0),
        gasPriceGwei: tx.gasPrice ? (Number(tx.gasPrice) / 1e9).toFixed(4) : '0',
        gasUsed: tx.gasUsed,
        status,
        timestamp,
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        nonce: tx.nonce,
        input: tx.input,
        type,
        tokenSymbol: 'ANDE',
      };
    },
    [address]
  );

  // Scan blockchain for transactions
  const scanBlockchainTransactions = useCallback(async () => {
    if (!publicClient || !address || !currentBlock) return;

    setIsLoading(true);
    setError(null);

    try {
      const startBlock = currentBlock > BigInt(BLOCKS_TO_SCAN) 
        ? currentBlock - BigInt(BLOCKS_TO_SCAN) 
        : BigInt(0);

      const foundTransactions: TransactionDetailed[] = [];

      // Scan blocks
      for (let i = 0; i < BLOCKS_TO_SCAN && (currentBlock - BigInt(i)) > startBlock; i++) {
        const blockNumber = currentBlock - BigInt(i);
        
        try {
          const block = await publicClient.getBlock({
            blockNumber,
            includeTransactions: true,
          });

          const blockTimestamp = Number(block.timestamp);

          for (const tx of block.transactions) {
            if (typeof tx === 'object') {
              const txFrom = tx.from?.toLowerCase();
              const txTo = tx.to?.toLowerCase();
              const userAddr = address.toLowerCase();

              // Check if transaction involves user's address
              if (txFrom === userAddr || txTo === userAddr) {
                // Get transaction receipt for gas used and status
                let receipt;
                try {
                  receipt = await publicClient.getTransactionReceipt({ hash: tx.hash });
                } catch (e) {
                  // Receipt not available yet
                }

                const detailedTx = formatTransaction(
                  {
                    ...tx,
                    gasUsed: receipt?.gasUsed,
                  },
                  blockTimestamp,
                  receipt?.status === 'success' ? 'success' : 'failed'
                );

                foundTransactions.push(detailedTx);
              }
            }
          }
        } catch (blockError) {
          console.error(`Error scanning block ${blockNumber}:`, blockError);
          continue;
        }
      }

      // Merge with stored transactions and remove duplicates
      const stored = loadStoredTransactions();
      const allTxs = [...foundTransactions, ...stored];
      
      // Deduplicate by hash
      const uniqueTxs = Array.from(
        new Map(allTxs.map(tx => [tx.hash, tx])).values()
      );

      // Sort by timestamp (newest first)
      uniqueTxs.sort((a, b) => b.timestamp - a.timestamp);

      setTransactions(uniqueTxs);
      saveTransactions(uniqueTxs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to scan transactions';
      setError(errorMessage);
      console.error('Error scanning blockchain:', err);
    } finally {
      setIsLoading(false);
    }
  }, [publicClient, address, currentBlock, loadStoredTransactions, saveTransactions, formatTransaction]);

  // Add a pending transaction
  const addPendingTransaction = useCallback(
    (tx: {
      hash: Hash;
      to: Address | null;
      value: bigint;
      gasPrice?: bigint;
      nonce?: number;
    }) => {
      if (!address) return;

      const pendingTx: TransactionDetailed = {
        hash: tx.hash,
        from: address,
        to: tx.to,
        value: tx.value,
        valueFormatted: formatEther(tx.value),
        gasPrice: tx.gasPrice || BigInt(0),
        gasPriceGwei: tx.gasPrice ? (Number(tx.gasPrice) / 1e9).toFixed(4) : '0',
        status: 'pending',
        timestamp: Date.now(),
        nonce: tx.nonce,
        type: tx.to === null ? 'contract' : 'send',
        tokenSymbol: 'ANDE',
      };

      setTransactions(prev => {
        const updated = [pendingTx, ...prev];
        saveTransactions(updated);
        return updated;
      });
    },
    [address, saveTransactions]
  );

  // Update transaction status with retry logic
  const updateTransactionStatus = useCallback(
    async (hash: Hash, retries = 5) => {
      if (!publicClient) return;

      try {
        // Try to get receipt with retries
        let receipt;
        let attempts = 0;
        
        while (attempts < retries) {
          try {
            receipt = await publicClient.getTransactionReceipt({ hash });
            break; // Success, exit loop
          } catch (err) {
            attempts++;
            if (attempts >= retries) {
              // Still pending after max retries, keep as pending
              console.log(`Transaction ${hash} still pending after ${retries} attempts`);
              return;
            }
            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
          }
        }

        if (!receipt) return;

        const transaction = await publicClient.getTransaction({ hash });
        const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });

        setTransactions(prev => {
          const updated = prev.map(tx => {
            if (tx.hash === hash) {
              return {
                ...tx,
                status: (receipt.status === 'success' ? 'success' : 'failed') as 'success' | 'failed',
                gasUsed: receipt.gasUsed,
                blockNumber: receipt.blockNumber,
                blockHash: receipt.blockHash,
                timestamp: Number(block.timestamp) * 1000,
              } as TransactionDetailed;
            }
            return tx;
          });
          saveTransactions(updated);
          return updated;
        });
      } catch (error) {
        // Silently handle - transaction might still be pending
        console.log('Transaction still pending:', hash.slice(0, 10));
      }
    },
    [publicClient, saveTransactions]
  );

  // Clear all transactions
  const clearHistory = useCallback(() => {
    if (!address) return;
    
    try {
      const key = `${STORAGE_KEY_PREFIX}${address.toLowerCase()}`;
      localStorage.removeItem(key);
      setTransactions([]);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [address]);

  // Get transaction by hash
  const getTransaction = useCallback(
    async (hash: Hash): Promise<TransactionDetailed | null> => {
      if (!publicClient) return null;

      try {
        const [tx, receipt] = await Promise.all([
          publicClient.getTransaction({ hash }),
          publicClient.getTransactionReceipt({ hash }).catch(() => null),
        ]);

        const block = tx.blockNumber 
          ? await publicClient.getBlock({ blockNumber: tx.blockNumber })
          : null;

        return formatTransaction(
          {
            ...tx,
            gasUsed: receipt?.gasUsed,
          },
          block ? Number(block.timestamp) : Date.now(),
          receipt?.status === 'success' ? 'success' : 'pending'
        );
      } catch (error) {
        console.error('Error fetching transaction:', error);
        return null;
      }
    },
    [publicClient, formatTransaction]
  );

  // Load initial data
  useEffect(() => {
    if (isConnected && address) {
      const stored = loadStoredTransactions();
      setTransactions(stored);
      
      // Scan blockchain in background
      scanBlockchainTransactions();
    } else {
      setTransactions([]);
    }
  }, [isConnected, address, loadStoredTransactions, scanBlockchainTransactions]);

  // Watch for new blocks and update pending transactions
  useEffect(() => {
    if (!currentBlock || transactions.length === 0) return;

    const pendingTxs = transactions.filter(tx => tx.status === 'pending');
    
    if (pendingTxs.length > 0) {
      // Update status of pending transactions with delay to avoid immediate failures
      const timer = setTimeout(() => {
        pendingTxs.forEach(tx => {
          updateTransactionStatus(tx.hash);
        });
      }, 2000); // Wait 2 seconds before checking

      return () => clearTimeout(timer);
    }
  }, [currentBlock, updateTransactionStatus]);

  return {
    transactions,
    isLoading,
    error,
    addPendingTransaction,
    updateTransactionStatus,
    clearHistory,
    getTransaction,
    refreshTransactions: scanBlockchainTransactions,
  };
}