'use client';

import { useEffect } from 'react';
import { useAccount, useReadContract, useBlockNumber, useChainId } from 'wagmi';
import { formatEther } from 'viem';
import { getContractAddress } from '@/contracts/addresses';
import { isAndeChain } from '@/lib/chains';

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
 * 
 * ✅ Fixed: Ahora usa chainId dinámico desde la wallet conectada
 */
export function useAndeBalance() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId(); // 🔥 Dinámico - viene de la wallet conectada
  
  // Validar que estamos en una chain válida de AndeChain
  const isValidChain = isAndeChain(chainId);
  
  // 🔥 Obtener dirección del token basada en el chainId actual
  const ANDE_TOKEN_ADDRESS = getContractAddress('ANDEToken', chainId);

  const { data: currentBlock } = useBlockNumber({ 
    watch: true, 
    chainId: chainId, // 🔥 Usar chainId dinámico
    query: {
      enabled: isValidChain && isConnected,
    },
  });

  // Leer balance de ANDETokenDuality
  const { 
    data: balanceData, 
    refetch: refetchBalance,
    isLoading,
    isError,
  } = useReadContract({
    address: ANDE_TOKEN_ADDRESS || undefined,
    abi: ANDE_TOKEN_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: chainId, // 🔥 Usar chainId dinámico
    query: {
      enabled: !!address && isConnected && isValidChain && !!ANDE_TOKEN_ADDRESS,
    },
  });

  // Leer símbolo
  const { data: symbol } = useReadContract({
    address: ANDE_TOKEN_ADDRESS || undefined,
    abi: ANDE_TOKEN_ABI,
    functionName: 'symbol',
    chainId: chainId, // 🔥 Usar chainId dinámico
    query: {
      enabled: isValidChain && !!ANDE_TOKEN_ADDRESS,
    },
  });

  // Leer decimales
  const { data: decimals } = useReadContract({
    address: ANDE_TOKEN_ADDRESS || undefined,
    abi: ANDE_TOKEN_ABI,
    functionName: 'decimals',
    chainId: chainId, // 🔥 Usar chainId dinámico
    query: {
      enabled: isValidChain && !!ANDE_TOKEN_ADDRESS,
    },
  });

  // Auto-refresh cuando hay nuevo bloque
  useEffect(() => {
    if (currentBlock && address && isValidChain) {
      refetchBalance();
    }
  }, [currentBlock, address, isValidChain, refetchBalance]);

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
    chainId, // 🔥 Exportar chainId para debugging
    isValidChain, // 🔥 Exportar validación
  };
}