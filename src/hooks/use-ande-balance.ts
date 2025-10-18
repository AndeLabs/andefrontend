'use client';

import { useEffect } from 'react';
import { useAccount, useReadContract, useBlockNumber } from 'wagmi';
import { formatEther } from 'viem';
import { andechain } from '@/lib/chains';
import { ANDE_TOKEN_ADDRESS } from '@/contracts/addresses';

// ABI mínimo para leer balance de ANDETokenDuality
const ANDE_TOKEN_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
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
] as const;

/**
 * Hook para obtener balance ANDE desde ANDETokenDuality
 * Este hook lee el balance correcto desde el token nativo dual
 */
export function useAndeBalance() {
  const { address, isConnected } = useAccount();
  const { data: currentBlock } = useBlockNumber({ 
    watch: true, 
    chainId: andechain.id 
  });

  // Leer balance de ANDETokenDuality
  const { 
    data: balanceData, 
    refetch: refetchBalance,
    isLoading,
    isError,
  } = useReadContract({
    address: ANDE_TOKEN_ADDRESS,
    abi: ANDE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Leer símbolo
  const { data: symbol } = useReadContract({
    address: ANDE_TOKEN_ADDRESS,
    abi: ANDE_TOKEN_ABI,
    functionName: 'symbol',
  });

  // Leer decimales
  const { data: decimals } = useReadContract({
    address: ANDE_TOKEN_ADDRESS,
    abi: ANDE_TOKEN_ABI,
    functionName: 'decimals',
  });

  // Auto-refresh cuando hay nuevo bloque
  useEffect(() => {
    if (currentBlock && address) {
      refetchBalance();
    }
  }, [currentBlock, address, refetchBalance]);

  // Formatear balance
  const balance = balanceData ? {
    value: balanceData as bigint,
    decimals: (decimals as number) || 18,
    symbol: (symbol as string) || 'ANDE',
    formatted: formatEther(balanceData as bigint),
  } : null;

  return {
    balance,
    isLoading,
    isError,
    refetch: refetchBalance,
    address,
    isConnected,
  };
}