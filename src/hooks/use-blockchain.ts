/**
 * Optimized Blockchain Hook
 * Provides cached, type-safe access to blockchain data
 * Prevents duplicate requests and optimizes re-renders
 */

import { useEffect, useMemo, useCallback } from 'react';
import { usePublicClient, useWalletClient } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Address, Hash } from 'viem';
import { BlockchainService } from '@/lib/blockchain-service';
import { andechain } from '@/lib/chains';

// ==========================================
// QUERY KEYS
// ==========================================

export const blockchainKeys = {
  all: ['blockchain'] as const,
  blockNumber: () => [...blockchainKeys.all, 'blockNumber'] as const,
  block: (number?: bigint) => [...blockchainKeys.all, 'block', number?.toString()] as const,
  transaction: (hash: Hash) => [...blockchainKeys.all, 'transaction', hash] as const,
  recentTransactions: (count: number) => [...blockchainKeys.all, 'recentTransactions', count] as const,
  nativeBalance: (address?: Address) => [...blockchainKeys.all, 'nativeBalance', address] as const,
  tokenBalance: (address?: Address) => [...blockchainKeys.all, 'tokenBalance', address] as const,
  tokenSupply: () => [...blockchainKeys.all, 'tokenSupply'] as const,
  proposal: (id: bigint) => [...blockchainKeys.all, 'proposal', id.toString()] as const,
  gasPrice: () => [...blockchainKeys.all, 'gasPrice'] as const,
};

// ==========================================
// MAIN HOOK
// ==========================================

export function useBlockchain() {
  const publicClient = usePublicClient({ chainId: andechain.id });
  const { data: walletClient } = useWalletClient({ chainId: andechain.id });

  const service = useMemo(() => {
    if (!publicClient) return null;
    return new BlockchainService(publicClient, walletClient);
  }, [publicClient, walletClient]);

  return service;
}

// ==========================================
// NETWORK QUERIES
// ==========================================

export function useBlockNumber(options?: { watch?: boolean; interval?: number }) {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.blockNumber(),
    queryFn: async () => {
      if (!service) throw new Error('Service not initialized');
      return service.getBlockNumber();
    },
    enabled: !!service,
    refetchInterval: options?.watch ? (options.interval || 2000) : false,
    staleTime: 1000,
  });
}

export function useBlock(blockNumber?: bigint) {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.block(blockNumber),
    queryFn: async () => {
      if (!service) throw new Error('Service not initialized');
      return service.getBlock(blockNumber);
    },
    enabled: !!service,
    staleTime: blockNumber ? Infinity : 5000, // Specific blocks never change
  });
}

export function useTransaction(hash?: Hash) {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.transaction(hash!),
    queryFn: async () => {
      if (!service || !hash) throw new Error('Service or hash not available');
      return service.getTransaction(hash);
    },
    enabled: !!service && !!hash,
    staleTime: Infinity, // Transactions never change
  });
}

export function useRecentTransactions(count: number = 10) {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.recentTransactions(count),
    queryFn: async () => {
      if (!service) throw new Error('Service not initialized');
      return service.getRecentTransactions(count);
    },
    enabled: !!service,
    refetchInterval: 5000, // Update every 5 seconds
    staleTime: 2000,
  });
}

export function useGasPrice() {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.gasPrice(),
    queryFn: async () => {
      if (!service) throw new Error('Service not initialized');
      return service.getGasPrice();
    },
    enabled: !!service,
    refetchInterval: 10000, // Update every 10 seconds
    staleTime: 5000,
  });
}

// ==========================================
// BALANCE QUERIES
// ==========================================

export function useNativeBalance(address?: Address, options?: { watch?: boolean }) {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.nativeBalance(address),
    queryFn: async () => {
      if (!service || !address) throw new Error('Service or address not available');
      return service.getNativeBalance(address);
    },
    enabled: !!service && !!address,
    refetchInterval: options?.watch ? 5000 : false,
    staleTime: 3000,
  });
}

export function useTokenBalance(address?: Address, options?: { watch?: boolean }) {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.tokenBalance(address),
    queryFn: async () => {
      if (!service || !address) throw new Error('Service or address not available');
      return service.getTokenBalance(address);
    },
    enabled: !!service && !!address,
    refetchInterval: options?.watch ? 5000 : false,
    staleTime: 3000,
  });
}

export function useTokenSupply() {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.tokenSupply(),
    queryFn: async () => {
      if (!service) throw new Error('Service not initialized');
      return service.getTokenTotalSupply();
    },
    enabled: !!service,
    staleTime: 30000, // 30 seconds
  });
}

// ==========================================
// TRANSACTION MUTATIONS
// ==========================================

export function useSendTransaction() {
  const service = useBlockchain();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      to,
      value,
      data,
    }: {
      to: Address;
      value: string;
      data?: `0x${string}`;
    }) => {
      if (!service) throw new Error('Service not initialized');
      return service.sendTransaction(to, value, data);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: blockchainKeys.all });
    },
  });
}

export function useTransferToken() {
  const service = useBlockchain();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, amount }: { to: Address; amount: string }) => {
      if (!service) throw new Error('Service not initialized');
      return service.transferToken(to, amount);
    },
    onSuccess: () => {
      // Invalidate token balances
      queryClient.invalidateQueries({ queryKey: blockchainKeys.all });
    },
  });
}

// ==========================================
// CONTRACT MUTATIONS
// ==========================================

export function useDeployContract() {
  const service = useBlockchain();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bytecode,
      abi,
      args,
    }: {
      bytecode: `0x${string}`;
      abi: any[];
      args?: any[];
    }) => {
      if (!service) throw new Error('Service not initialized');
      return service.deployContract(bytecode, abi, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockchainKeys.all });
    },
  });
}

export function useContractWrite() {
  const service = useBlockchain();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      address,
      abi,
      functionName,
      args,
    }: {
      address: Address;
      abi: any[];
      functionName: string;
      args?: any[];
    }) => {
      if (!service) throw new Error('Service not initialized');
      return service.writeContract(address, abi, functionName, args);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockchainKeys.all });
    },
  });
}

// ==========================================
// GOVERNANCE
// ==========================================

export function useProposal(proposalId?: bigint) {
  const service = useBlockchain();

  return useQuery({
    queryKey: blockchainKeys.proposal(proposalId!),
    queryFn: async () => {
      if (!service || proposalId === undefined) throw new Error('Service or proposal ID not available');
      return service.getProposal(proposalId);
    },
    enabled: !!service && proposalId !== undefined,
    staleTime: 10000,
  });
}

export function useCastVote() {
  const service = useBlockchain();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      proposalId,
      support,
    }: {
      proposalId: bigint;
      support: 0 | 1 | 2;
    }) => {
      if (!service) throw new Error('Service not initialized');
      return service.castVote(proposalId, support);
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific proposal
      queryClient.invalidateQueries({
        queryKey: blockchainKeys.proposal(variables.proposalId),
      });
    },
  });
}

// ==========================================
// UTILITIES
// ==========================================

export function useWaitForTransaction(hash?: Hash) {
  const service = useBlockchain();

  return useQuery({
    queryKey: [...blockchainKeys.transaction(hash!), 'receipt'],
    queryFn: async () => {
      if (!service || !hash) throw new Error('Service or hash not available');
      return service.waitForTransaction(hash);
    },
    enabled: !!service && !!hash,
    staleTime: Infinity,
    retry: 3,
  });
}

export function useEstimateGas(
  to?: Address,
  value?: bigint,
  data?: `0x${string}`
) {
  const service = useBlockchain();

  return useQuery({
    queryKey: [...blockchainKeys.all, 'estimateGas', to, value?.toString(), data],
    queryFn: async () => {
      if (!service || !to) throw new Error('Service or address not available');
      return service.estimateGas(to, value, data);
    },
    enabled: !!service && !!to,
    staleTime: 5000,
  });
}

// ==========================================
// COMPOSABLE HOOK
// ==========================================

export function useBlockchainData(address?: Address) {
  const blockNumber = useBlockNumber({ watch: true });
  const nativeBalance = useNativeBalance(address, { watch: true });
  const tokenBalance = useTokenBalance(address, { watch: true });
  const gasPrice = useGasPrice();
  const recentTxs = useRecentTransactions(5);

  return {
    blockNumber: blockNumber.data,
    nativeBalance: nativeBalance.data,
    tokenBalance: tokenBalance.data,
    gasPrice: gasPrice.data,
    recentTransactions: recentTxs.data,
    isLoading:
      blockNumber.isLoading ||
      nativeBalance.isLoading ||
      tokenBalance.isLoading ||
      gasPrice.isLoading ||
      recentTxs.isLoading,
    error:
      blockNumber.error ||
      nativeBalance.error ||
      tokenBalance.error ||
      gasPrice.error ||
      recentTxs.error,
  };
}