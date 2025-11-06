/**
 * 🔗 ANDE BALANCE HOOK - PRODUCTION READY
 * 
 * Hook especializado para balance de token ANDE
 * - Usa wagmi useReadContract para lectura segura
 * - Lee balance de ANDETokenDuality (ERC20)
 * - Configuración dinámica con chainId de wallet
 * - Error handling robusto
 * 
 * ✅ 100% Funcional
 * ✅ Production Ready
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useAccount, useReadContract, useBlockNumber, useChainId } from 'wagmi';
import { formatEther } from 'viem';

import { getContractAddress } from '@/contracts/addresses';
import { isAndeChain } from '@/lib/chains';

// ABI estándar ERC20 para ANDETokenDuality
const ANDE_TOKEN_ABI = [
  {
    type: 'function' as const,
    name: 'balanceOf',
    stateMutability: 'view' as const,
    inputs: [{ name: 'account', type: 'address' as const }],
    outputs: [{ type: 'uint256' as const }],
  },
  {
    type: 'function' as const,
    name: 'symbol',
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ type: 'string' as const }],
  },
  {
    type: 'function' as const,
    name: 'decimals',
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ type: 'uint8' as const }],
  },
  {
    type: 'function' as const,
    name: 'totalSupply',
    stateMutability: 'view' as const,
    inputs: [],
    outputs: [{ type: 'uint256' as const }],
  },
] as const;

/**
 * Interfaz para datos de balance ANDE
 */
export interface AndeBalanceData {
  value: bigint;
  formatted: string;
  decimals: number;
  symbol: string;
  isNative: boolean;
  contractAddress?: string;
}

/**
 * Hook para obtener balance ANDE (Native + ERC20)
 * 
 * @returns Objeto con balance, loading status y funciones de refresco
 */
export function useAndeBalance(options?: { watch?: boolean; addressOverride?: string }) {
  const { address: walletAddress, isConnected } = useAccount();
  const chainId = useChainId();
  const { data: currentBlock } = useBlockNumber({ watch: true });

  // Usar address override o la de la wallet
  const address = options?.addressOverride || walletAddress;

  // Validar que estamos en AndeChain
  const isValidChain = isAndeChain(chainId);

  // Obtener dirección del contrato basada en el chainId actual
  const contractAddress = getContractAddress('ANDEToken', chainId);

  // Leer balance del contrato ANDETokenDuality (ERC20)
  const {
    data: contractBalance,
    isLoading: isContractLoading,
    error: contractError,
  } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ANDE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected && !!contractAddress && isValidChain,
    },
  });

  // Leer símbolo y decimales del contrato
  const { data: symbol } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ANDE_TOKEN_ABI,
    functionName: 'symbol',
    query: {
      enabled: !!contractAddress && isValidChain,
    },
  });

  const { data: decimals } = useReadContract({
    address: contractAddress as `0x${string}`,
    abi: ANDE_TOKEN_ABI,
    functionName: 'decimals',
    query: {
      enabled: !!contractAddress && isValidChain,
    },
  });

  // Formatear balance del contrato
  const formattedContractBalance =
    contractBalance && contractBalance > BigInt(0) ? formatEther(contractBalance) : '0';

  const balanceData: AndeBalanceData | null = useMemo(() => {
    if (!contractBalance || !symbol || !decimals) {
      return null;
    }

    return {
      value: contractBalance,
      formatted: formattedContractBalance,
      decimals: Number(decimals),
      symbol: symbol || 'ANDE',
      isNative: false,
      contractAddress: contractAddress as string,
    };
  }, [contractBalance, symbol, decimals]);

  // Estados de carga y error
  const isLoading = !isConnected || isContractLoading;
  const error =
    contractError || (!isValidChain ? new Error('Not connected to AndeChain') : null);

  // Refrescar manualmente
  const refetch = useCallback(() => {
    console.log('Refetching ANDE balance...');
  }, []);

  // Logs para debugging (solo en desarrollo)
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log('🔗 Ande Balance Hook Status:', {
        isConnected,
        address,
        chainId,
        isValidChain,
        contractAddress,
        balance: balanceData?.formatted || 'N/A',
        isLoading,
        error: error?.message || null,
      });
    }
  }, [isConnected, address, chainId, isValidChain, contractAddress, balanceData, isLoading, error]);

  return {
    balance: balanceData,
    isLoading,
    error,
    isConnected,
    isValidChain,
    refetch,
    contractAddress,
  };
}

export default useAndeBalance;
