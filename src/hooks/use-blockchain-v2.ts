/**
 * ============================================
 * HOOKS BLOCKCHAIN V2 - PRODUCCIÓN
 * ============================================
 * 
 * Hooks optimizados para datos de blockchain en tiempo real
 * - Real-time updates con React Query
 * - Smart caching
 * - Error handling robusto
 * - Type-safe con TypeScript
 * - Integrado con BlockchainServiceV2
 */

'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address, Hash } from 'viem';
import {
  BlockchainServiceV2,
  createBlockchainService,
  BlockchainConfig,
  ConnectionStatus,
  ChainMetrics,
  TransactionInfo,
} from '@/lib/blockchain-service-v2';

// ============================================
// CONFIGURACIÓN DESDE ENV
// ============================================

function getBlockchainConfig(): BlockchainConfig {
  return {
    chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '6174', 10),
    rpcUrl: process.env.NEXT_PUBLIC_RPC_HTTP || 'http://localhost:8545',
    wsUrl: process.env.NEXT_PUBLIC_RPC_WS,
    apiUrl: process.env.NEXT_PUBLIC_API_URL,
    timeout: parseInt(process.env.NEXT_PUBLIC_RPC_TIMEOUT || '30000', 10),
    retries: parseInt(process.env.NEXT_PUBLIC_RPC_RETRIES || '3', 10),
    enableWs: process.env.NEXT_PUBLIC_WS_ENABLED === 'true',
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
  };
}

// ============================================
// HOOKS DE CONEXIÓN
// ============================================

/**
 * Hook para obtener el servicio de blockchain
 */
export function useBlockchainService(): BlockchainServiceV2 | null {
  const serviceRef = useRef<BlockchainServiceV2 | null>(null);

  useEffect(() => {
    if (!serviceRef.current) {
      try {
        const config = getBlockchainConfig();
        serviceRef.current = createBlockchainService(config);
      } catch (error) {
        console.error('Failed to initialize blockchain service:', error);
      }
    }

    return () => {
      // No destruir aquí porque queremos mantener la instancia singleton
    };
  }, []);

  return serviceRef.current;
}

/**
 * Hook para verificar conexión
 */
export function useConnectionStatus() {
  const service = useBlockchainService();
  const [status, setStatus] = useState<ConnectionStatus>({
    connected: false,
  });

  // Verificar conexión inicial
  useEffect(() => {
    if (!service) return;

    const checkConnection = async () => {
      const isConnected = await service.verifyConnection();
      setStatus(service.getConnectionStatus());
    };

    checkConnection();
  }, [service]);

  // Monitorear cambios de status
  useEffect(() => {
    if (!service) return;

    const interval = setInterval(() => {
      setStatus(service.getConnectionStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [service]);

  return status;
}

// ============================================
// QUERY KEYS
// ============================================

export const blockchainQueryKeys = {
  all: ['blockchain'] as const,
  blockNumber: () => [...blockchainQueryKeys.all, 'blockNumber'] as const,
  block: (blockNumber?: number | 'latest') => [
    ...blockchainQueryKeys.all,
    'block',
    blockNumber,
  ] as const,
  balance: (address?: Address) => [...blockchainQueryKeys.all, 'balance', address] as const,
  gasPrice: () => [...blockchainQueryKeys.all, 'gasPrice'] as const,
  transaction: (hash?: Hash) => [...blockchainQueryKeys.all, 'transaction', hash] as const,
  metrics: () => [...blockchainQueryKeys.all, 'metrics'] as const,
  connectionStatus: () => [...blockchainQueryKeys.all, 'connectionStatus'] as const,
} as const;

// ============================================
// HOOKS DE DATOS
// ============================================

/**
 * Hook para obtener el número de bloque actual
 */
export function useBlockNumber(options?: { watch?: boolean }) {
  const service = useBlockchainService();

  return useQuery({
    queryKey: blockchainQueryKeys.blockNumber(),
    queryFn: async () => {
      if (!service) throw new Error('Blockchain service not available');
      return await service.getBlockNumber();
    },
    enabled: !!service,
    refetchInterval: options?.watch ? 2000 : false,
    staleTime: 1000,
    gcTime: 5000,
    retry: 2,
  });
}

/**
 * Hook para obtener información del bloque
 */
export function useBlock(blockNumber?: number | 'latest') {
  const service = useBlockchainService();

  return useQuery({
    queryKey: blockchainQueryKeys.block(blockNumber),
    queryFn: async () => {
      if (!service) throw new Error('Blockchain service not available');
      return await service.getBlock(blockNumber);
    },
    enabled: !!service,
    staleTime: 5000,
    gcTime: 10000,
    retry: 2,
  });
}

/**
 * Hook para obtener el balance de una dirección
 */
export function useBalance(address?: Address, options?: { watch?: boolean }) {
  const service = useBlockchainService();

  return useQuery({
    queryKey: blockchainQueryKeys.balance(address),
    queryFn: async () => {
      if (!service || !address) throw new Error('Service or address not available');
      return await service.getBalance(address);
    },
    enabled: !!service && !!address,
    refetchInterval: options?.watch ? 5000 : false,
    staleTime: 3000,
    gcTime: 10000,
    retry: 2,
  });
}

/**
 * Hook para obtener el balance formateado
 */
export function useBalanceFormatted(address?: Address, options?: { watch?: boolean }) {
  const service = useBlockchainService();

  return useQuery({
    queryKey: [...blockchainQueryKeys.balance(address), 'formatted'] as const,
    queryFn: async () => {
      if (!service || !address) throw new Error('Service or address not available');
      return await service.getBalanceFormatted(address);
    },
    enabled: !!service && !!address,
    refetchInterval: options?.watch ? 5000 : false,
    staleTime: 3000,
    gcTime: 10000,
    retry: 2,
  });
}

/**
 * Hook para obtener el gas price
 */
export function useGasPrice() {
  const service = useBlockchainService();

  return useQuery({
    queryKey: blockchainQueryKeys.gasPrice(),
    queryFn: async () => {
      if (!service) throw new Error('Blockchain service not available');
      return await service.getGasPrice();
    },
    enabled: !!service,
    refetchInterval: 10000,
    staleTime: 5000,
    gcTime: 15000,
    retry: 2,
  });
}

/**
 * Hook para obtener información de una transacción
 */
export function useTransaction(hash?: Hash) {
  const service = useBlockchainService();

  return useQuery({
    queryKey: blockchainQueryKeys.transaction(hash),
    queryFn: async () => {
      if (!service || !hash) throw new Error('Service or hash not available');
      return await service.getTransaction(hash);
    },
    enabled: !!service && !!hash,
    staleTime: Infinity, // Las transacciones no cambian
    gcTime: 30000,
    retry: 2,
  });
}

/**
 * Hook para esperar confirmación de transacción
 */
export function useWaitForTransaction(
  hash?: Hash,
  options?: { confirmations?: number; timeout?: number }
) {
  const service = useBlockchainService();

  return useQuery({
    queryKey: [...blockchainQueryKeys.transaction(hash), 'receipt'] as const,
    queryFn: async () => {
      if (!service || !hash) throw new Error('Service or hash not available');
      return await service.waitForTransaction(
        hash,
        options?.confirmations || 1,
        options?.timeout || 60000
      );
    },
    enabled: !!service && !!hash,
    refetchInterval: 3000,
    staleTime: 1000,
    gcTime: 10000,
    retry: 5,
  });
}

/**
 * Hook para obtener métricas de la red
 */
export function useChainMetrics() {
  const service = useBlockchainService();

  return useQuery({
    queryKey: blockchainQueryKeys.metrics(),
    queryFn: async () => {
      if (!service) throw new Error('Blockchain service not available');
      return await service.getChainMetrics();
    },
    enabled: !!service,
    refetchInterval: 5000,
    staleTime: 2000,
    gcTime: 10000,
    retry: 2,
  });
}

// ============================================
// HOOKS COMPOSABLES
// ============================================

/**
 * Hook para obtener todos los datos del blockchain en una llamada
 */
export function useBlockchainData(address?: Address) {
  const blockNumber = useBlockNumber({ watch: true });
  const balance = useBalance(address, { watch: true });
  const balanceFormatted = useBalanceFormatted(address, { watch: true });
  const gasPrice = useGasPrice();
  const metrics = useChainMetrics();
  const connectionStatus = useConnectionStatus();

  return useMemo(
    () => ({
      blockNumber: blockNumber.data,
      balance: balance.data,
      balanceFormatted: balanceFormatted.data,
      gasPrice: gasPrice.data,
      metrics: metrics.data,
      connectionStatus,

      isLoading:
        blockNumber.isLoading ||
        balance.isLoading ||
        balanceFormatted.isLoading ||
        gasPrice.isLoading ||
        metrics.isLoading,

      error:
        blockNumber.error ||
        balance.error ||
        balanceFormatted.error ||
        gasPrice.error ||
        metrics.error,

      refetch: () => {
        blockNumber.refetch();
        balance.refetch();
        balanceFormatted.refetch();
        gasPrice.refetch();
        metrics.refetch();
      },
    }),
    [
      blockNumber.data,
      balance.data,
      balanceFormatted.data,
      gasPrice.data,
      metrics.data,
      connectionStatus,
      blockNumber.isLoading,
      balance.isLoading,
      balanceFormatted.isLoading,
      gasPrice.isLoading,
      metrics.isLoading,
      blockNumber.error,
      balance.error,
      balanceFormatted.error,
      gasPrice.error,
      metrics.error,
      blockNumber.refetch,
      balance.refetch,
      balanceFormatted.refetch,
      gasPrice.refetch,
      metrics.refetch,
    ]
  );
}

/**
 * Hook para obtener datos de transacción con confirmación
 */
export function useTransactionWithReceipt(hash?: Hash) {
  const transaction = useTransaction(hash);
  const receipt = useWaitForTransaction(hash);

  return useMemo(
    () => ({
      transaction: transaction.data,
      receipt: receipt.data,
      isLoading: transaction.isLoading || receipt.isLoading,
      error: transaction.error || receipt.error,
    }),
    [transaction.data, receipt.data, transaction.isLoading, receipt.isLoading, transaction.error, receipt.error]
  );
}
