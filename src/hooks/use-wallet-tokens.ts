'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAccount, usePublicClient, useReadContract } from 'wagmi';
import { formatUnits, getAddress, type Address } from 'viem';
import { andechainTestnet as andechain } from '@/lib/chains';
import { ANDE_TOKEN_ADDRESS } from '@/contracts/addresses';

// ERC20 ABI (minimal for token detection)
const ERC20_ABI = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
] as const;

export interface TokenInfo {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  balance: bigint;
  balanceFormatted: string;
  totalSupply?: bigint;
  logo?: string;
  isNative?: boolean;
}

export interface TokenTransfer {
  from: Address;
  to: Address;
  value: bigint;
  tokenAddress: Address;
  tokenSymbol: string;
  blockNumber: bigint;
  timestamp: number;
  transactionHash: string;
}

interface UseWalletTokensReturn {
  tokens: TokenInfo[];
  isLoading: boolean;
  error: string | null;
  nativeBalance: TokenInfo | null;
  addCustomToken: (address: Address) => Promise<boolean>;
  removeToken: (address: Address) => void;
  refreshTokens: () => Promise<void>;
  tokenTransfers: TokenTransfer[];
  isLoadingTransfers: boolean;
}

// Storage keys
const CUSTOM_TOKENS_KEY = 'ande_custom_tokens';
const KNOWN_TOKENS_KEY = 'ande_known_tokens';

export function useWalletTokens(): UseWalletTokensReturn {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: andechain.id });

  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [nativeBalance, setNativeBalance] = useState<TokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenTransfers, setTokenTransfers] = useState<TokenTransfer[]>([]);
  const [isLoadingTransfers, setIsLoadingTransfers] = useState(false);

  // Load custom tokens from localStorage
  const loadCustomTokens = useCallback((): Address[] => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(CUSTOM_TOKENS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading custom tokens:', e);
      return [];
    }
  }, []);

  // Save custom tokens to localStorage
  const saveCustomTokens = useCallback((tokenAddresses: Address[]) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(CUSTOM_TOKENS_KEY, JSON.stringify(tokenAddresses));
    } catch (e) {
      console.error('Error saving custom tokens:', e);
    }
  }, []);

  // Get token info from contract
  const getTokenInfo = useCallback(
    async (tokenAddress: Address): Promise<TokenInfo | null> => {
      if (!publicClient || !address) return null;

      try {
        // Read token data
        const [name, symbol, decimals, balance, totalSupply] = await Promise.all([
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'name',
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'symbol',
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'decimals',
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'balanceOf',
            args: [address],
          }),
          publicClient.readContract({
            address: tokenAddress,
            abi: ERC20_ABI,
            functionName: 'totalSupply',
          }).catch(() => BigInt(0)),
        ]);

        const balanceFormatted = formatUnits(balance as bigint, decimals as number);

        return {
          address: tokenAddress,
          name: name as string,
          symbol: symbol as string,
          decimals: decimals as number,
          balance: balance as bigint,
          balanceFormatted,
          totalSupply: totalSupply as bigint,
          isNative: false,
        };
      } catch (error) {
        console.error(`Error fetching token info for ${tokenAddress}:`, error);
        return null;
      }
    },
    [publicClient, address]
  );

  // Get native ANDE balance from ANDETokenDuality
  const getNativeBalance = useCallback(async (): Promise<TokenInfo | null> => {
    if (!publicClient || !address) return null;

    try {
      // ANDE es NATIVO - leer desde account.balance
      const balance = await publicClient.readContract({
        address: ANDE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      }) as bigint;

      const balanceFormatted = formatUnits(balance, 18);

      return {
        address: ANDE_TOKEN_ADDRESS,
        name: 'ANDE',
        symbol: 'ANDE',
        decimals: 18,
        balance,
        balanceFormatted,
        isNative: true, // ✅ ANDE es moneda nativa del sovereign rollup
      };
    } catch (error) {
      console.error('Error fetching ANDE balance:', error);
      return null;
    }
  }, [publicClient, address]);

  // Detect tokens by scanning recent transactions
  const detectTokensFromTransactions = useCallback(async (): Promise<Address[]> => {
    if (!publicClient || !address) return [];

    try {
      // Get recent blocks
      const currentBlock = await publicClient.getBlockNumber();
      const blocksToScan = 100n; // Scan last 100 blocks
      const startBlock = currentBlock > blocksToScan ? currentBlock - blocksToScan : 0n;

      const detectedTokens = new Set<Address>();

      // Scan blocks for ERC20 Transfer events
      // Transfer(address indexed from, address indexed to, uint256 value)
      const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

      try {
        const logs = await publicClient.getLogs({
          fromBlock: startBlock,
          toBlock: currentBlock,
        } as any);

        for (const log of logs) {
          if (log.address) {
            // Check if this address involves our wallet
            const from = log.topics[1] ? `0x${log.topics[1].slice(26)}` as Address : null;
            const to = log.topics[2] ? `0x${log.topics[2].slice(26)}` as Address : null;

            if (
              from?.toLowerCase() === address.toLowerCase() ||
              to?.toLowerCase() === address.toLowerCase()
            ) {
              detectedTokens.add(getAddress(log.address));
            }
          }
        }
      } catch (error) {
        console.log('Token detection from logs skipped:', error);
      }

      return Array.from(detectedTokens);
    } catch (error) {
      console.error('Error detecting tokens:', error);
      return [];
    }
  }, [publicClient, address]);

  // Load token transfers history
  const loadTokenTransfers = useCallback(async () => {
    if (!publicClient || !address) return;

    setIsLoadingTransfers(true);
    try {
      const currentBlock = await publicClient.getBlockNumber();
      const blocksToScan = 50n;
      const startBlock = currentBlock > blocksToScan ? currentBlock - blocksToScan : 0n;

      const transferEventSignature = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

      const logs = await publicClient.getLogs({
        fromBlock: startBlock,
        toBlock: currentBlock,
      } as any);

      const transfers: TokenTransfer[] = [];

      for (const log of logs) {
        if (!log.topics[1] || !log.topics[2]) continue;

        const from = `0x${log.topics[1].slice(26)}` as Address;
        const to = `0x${log.topics[2].slice(26)}` as Address;

        // Only include transfers involving our address
        if (
          from.toLowerCase() !== address.toLowerCase() &&
          to.toLowerCase() !== address.toLowerCase()
        ) {
          continue;
        }

        const value = log.data ? BigInt(log.data) : BigInt(0);

        // Get block for timestamp
        const block = await publicClient.getBlock({ blockNumber: log.blockNumber! });

        // Try to get token symbol
        let tokenSymbol = 'UNKNOWN';
        try {
          const symbol = await publicClient.readContract({
            address: log.address,
            abi: ERC20_ABI,
            functionName: 'symbol',
          });
          tokenSymbol = symbol as string;
        } catch (e) {
          // Ignore
        }

        transfers.push({
          from,
          to,
          value,
          tokenAddress: log.address,
          tokenSymbol,
          blockNumber: log.blockNumber!,
          timestamp: Number(block.timestamp),
          transactionHash: log.transactionHash!,
        });
      }

      // Sort by block number descending
      transfers.sort((a, b) => Number(b.blockNumber - a.blockNumber));

      setTokenTransfers(transfers.slice(0, 20)); // Keep last 20
    } catch (error) {
      console.error('Error loading token transfers:', error);
    } finally {
      setIsLoadingTransfers(false);
    }
  }, [publicClient, address]);

  // Refresh all tokens
  const refreshTokens = useCallback(async () => {
    if (!isConnected || !address || !publicClient) {
      setTokens([]);
      setNativeBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Load native balance
      const native = await getNativeBalance();
      setNativeBalance(native);

      // Load custom tokens
      const customTokens = loadCustomTokens();

      // Detect tokens from transactions
      const detectedTokens = await detectTokensFromTransactions();

      // Combine and deduplicate, filter out precompile mock and ANDE token
      const allTokenAddresses = Array.from(
        new Set([...customTokens, ...detectedTokens])
      ).filter(addr => 
        addr.toLowerCase() !== ANDE_TOKEN_ADDRESS.toLowerCase() &&
        addr.toLowerCase() !== '0xa85233c63b9ee964add6f2cffe00fd84eb32338f' // Precompile mock
      );

      // Fetch info for all tokens
      const tokenInfoPromises = allTokenAddresses.map((addr) => getTokenInfo(addr));
      const tokenInfos = await Promise.all(tokenInfoPromises);

      // Filter out nulls and tokens with zero balance (optional)
      const validTokens = tokenInfos.filter(
        (token): token is TokenInfo => token !== null && token.balance > BigInt(0)
      );

      // Sort by balance (descending)
      validTokens.sort((a, b) => {
        const aValue = Number(a.balance) / Math.pow(10, a.decimals);
        const bValue = Number(b.balance) / Math.pow(10, b.decimals);
        return bValue - aValue;
      });

      setTokens(validTokens);

      // Save detected tokens as known tokens
      if (typeof window !== 'undefined') {
        const knownTokens = validTokens.map((t) => t.address);
        localStorage.setItem(KNOWN_TOKENS_KEY, JSON.stringify(knownTokens));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tokens');
      console.error('Error refreshing tokens:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    isConnected,
    address,
    publicClient,
    getNativeBalance,
    loadCustomTokens,
    detectTokensFromTransactions,
    getTokenInfo,
  ]);

  // Add custom token
  const addCustomToken = useCallback(
    async (tokenAddress: Address): Promise<boolean> => {
      if (!publicClient || !address) return false;

      try {
        const tokenInfo = await getTokenInfo(tokenAddress);
        if (!tokenInfo) return false;

        // Add to custom tokens
        const customTokens = loadCustomTokens();
        if (!customTokens.includes(tokenAddress)) {
          const updated = [...customTokens, tokenAddress];
          saveCustomTokens(updated);
        }

        // Refresh tokens
        await refreshTokens();

        return true;
      } catch (error) {
        console.error('Error adding custom token:', error);
        return false;
      }
    },
    [publicClient, address, getTokenInfo, loadCustomTokens, saveCustomTokens, refreshTokens]
  );

  // Remove token
  const removeToken = useCallback(
    (tokenAddress: Address) => {
      const customTokens = loadCustomTokens();
      const updated = customTokens.filter((addr) => addr.toLowerCase() !== tokenAddress.toLowerCase());
      saveCustomTokens(updated);
      
      // Remove from current tokens
      setTokens((prev) => prev.filter((t) => t.address.toLowerCase() !== tokenAddress.toLowerCase()));
    },
    [loadCustomTokens, saveCustomTokens]
  );

  // Initial load
  useEffect(() => {
    refreshTokens();
  }, [refreshTokens]);

  // Load token transfers
  useEffect(() => {
    if (isConnected && address) {
      loadTokenTransfers();
    }
  }, [isConnected, address, loadTokenTransfers]);

  return {
    tokens,
    isLoading,
    error,
    nativeBalance,
    addCustomToken,
    removeToken,
    refreshTokens,
    tokenTransfers,
    isLoadingTransfers,
  };
}