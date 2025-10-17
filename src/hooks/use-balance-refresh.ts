'use client';

import { useEffect, useState } from 'react';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import { andechain } from '@/lib/chains';

/**
 * Hook mejorado para obtener balance con refetch automático
 * Soluciona el problema de balance no actualizado después de faucet
 */
export function useBalanceRefresh(refetchInterval = 2000) {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: balance, refetch, isLoading } = useBalance({
    address: address,
    chainId: andechain.id,
  });
  
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Refetch automático cada X ms
  useEffect(() => {
    if (!isConnected || !address) return;

    const interval = setInterval(() => {
      refetch();
      setLastUpdate(Date.now());
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [isConnected, address, refetch, refetchInterval]);

  // Refetch manual cuando se solicita
  const manualRefresh = async () => {
    await refetch();
    setLastUpdate(Date.now());
  };

  return {
    balance,
    isLoading,
    refetch: manualRefresh,
    lastUpdate,
  };
}
