'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { formatEther, parseEther } from 'viem';
import { andechainTestnet as andechain } from '@/lib/chains';

/**
 * Hook para verificar si el usuario tiene suficiente gas para transacciones
 * Verifica el balance nativo de ANDE para pagar gas fees
 */
export function useGasCheck() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: andechain.id });
  const [hasEnoughGas, setHasEnoughGas] = useState(true);
  const [estimatedGasNeeded, setEstimatedGasNeeded] = useState('0.01'); // Default estimate

  // Leer balance nativo (para gas)
  const { 
    data: nativeBalance, 
    refetch: refetchNativeBalance,
    isLoading: isLoadingNativeBalance,
  } = useBalance({
    address,
    chainId: andechain.id,
  });

  // Verificar si hay suficiente gas
  useEffect(() => {
    if (!nativeBalance) {
      setHasEnoughGas(false);
      return;
    }

    // Mínimo recomendado: 0.01 ANDE para gas
    const minGasRequired = parseEther('0.01');
    setHasEnoughGas(nativeBalance.value >= minGasRequired);
  }, [nativeBalance]);

  /**
   * Estima el gas necesario para una transacción
   */
  const estimateGas = async (
    to: `0x${string}`,
    data?: `0x${string}`,
    value?: bigint
  ): Promise<{ gasLimit: bigint; gasCost: bigint } | null> => {
    if (!publicClient || !address) return null;

    try {
      // Estimar gas limit
      const gasLimit = await publicClient.estimateGas({
        account: address,
        to,
        data,
        value,
      });

      // Obtener precio del gas
      const gasPrice = await publicClient.getGasPrice();

      // Calcular costo total del gas
      const gasCost = gasLimit * gasPrice;

      return { gasLimit, gasCost };
    } catch (error) {
      console.error('Error estimating gas:', error);
      return null;
    }
  };

  /**
   * Verifica si el usuario tiene suficiente gas para una transacción específica
   */
  const canAffordGas = async (
    to: `0x${string}`,
    data?: `0x${string}`,
    value?: bigint
  ): Promise<boolean> => {
    if (!nativeBalance) return false;

    const estimate = await estimateGas(to, data, value);
    if (!estimate) return false;

    // Agregar 20% de margen de seguridad
    const gasWithBuffer = (estimate.gasCost * BigInt(120)) / BigInt(100);

    return nativeBalance.value >= gasWithBuffer;
  };

  /**
   * Obtiene mensaje de error si no hay suficiente gas
   */
  const getGasErrorMessage = (): string | null => {
    if (!isConnected) return null;
    if (isLoadingNativeBalance) return null;

    if (!nativeBalance || nativeBalance.value === BigInt(0)) {
      return 'No native ANDE balance for gas. Please get ANDE from the faucet first.';
    }

    if (!hasEnoughGas) {
      return `Insufficient ANDE for gas fees. You have ${formatEther(nativeBalance.value)} ANDE, but need at least ${estimatedGasNeeded} ANDE for gas.`;
    }

    return null;
  };

  /**
   * Formatea el balance nativo para mostrar
   */
  const formattedNativeBalance = nativeBalance 
    ? formatEther(nativeBalance.value)
    : '0';

  return {
    // Balance nativo
    nativeBalance: nativeBalance?.value || BigInt(0),
    formattedNativeBalance,
    
    // Estado de gas
    hasEnoughGas,
    isLoadingNativeBalance,
    estimatedGasNeeded,
    
    // Funciones
    estimateGas,
    canAffordGas,
    getGasErrorMessage,
    refetchNativeBalance,
    
    // Conectividad
    isConnected,
    address,
  };
}

/**
 * Hook simplificado solo para verificar si hay gas suficiente
 */
export function useHasGas(): { hasGas: boolean; isLoading: boolean } {
  const { hasEnoughGas, isLoadingNativeBalance } = useGasCheck();
  
  return {
    hasGas: hasEnoughGas,
    isLoading: isLoadingNativeBalance,
  };
}