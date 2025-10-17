'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePublicClient, useBlockNumber, useAccount } from 'wagmi';
import { andechain } from '@/lib/chains';
import { logger } from '@/lib/logger';

/**
 * Estado de la cadena blockchain
 */
export interface ChainStatusData {
  blockNumber: number;
  chainId: number;
  gasPrice: bigint;
  isConnected: boolean;
}

/**
 * Hook para obtener datos en tiempo real de la cadena blockchain
 * Proporciona información sobre el número de bloque, ID de cadena, precio del gas e estado de conexión
 *
 * @returns Objeto con datos de la cadena, estado de carga y función de refresco
 */
export function useChainStatus() {
  // Obtener cliente público de wagmi para interactuar con la cadena
  const publicClient = usePublicClient({ chainId: andechain.id });

  // Obtener número de bloque actual con watch habilitado para actualizaciones en tiempo real
  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({
    watch: true,
    chainId: andechain.id,
  });

  // Obtener estado de conexión de la wallet
  const { isConnected } = useAccount();

  // Estado local para almacenar datos de la cadena
  const [chainData, setChainData] = useState<ChainStatusData>({
    blockNumber: 0,
    chainId: andechain.id,
    gasPrice: BigInt(0),
    isConnected: false,
  });

  // Estado de carga general
  const [loading, setLoading] = useState(true);

  // Estado de error
  const [error, setError] = useState<Error | null>(null);

  /**
   * Obtiene el precio del gas actual de la cadena
   * Se ejecuta cuando hay un nuevo bloque o cuando se solicita manualmente
   */
  const fetchGasPrice = useCallback(async () => {
    if (!publicClient) {
      logger.warn('Public client not available for gas price fetch');
      return;
    }

    try {
      logger.info('Fetching gas price from chain');

      const price = await publicClient.getGasPrice();

      setChainData((prev) => ({
        ...prev,
        gasPrice: price,
      }));

      logger.info('Gas price updated', {
        gasPrice: price.toString(),
      });

      setError(null);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));

      logger.error('Failed to fetch gas price', {
        error: error.message,
      });

      setError(error);
    }
  }, [publicClient]);

  /**
   * Efecto para actualizar el número de bloque cuando cambia
   */
  useEffect(() => {
    if (blockNumber !== undefined) {
      setChainData((prev) => ({
        ...prev,
        blockNumber: Number(blockNumber),
      }));

      logger.info('Block number updated', {
        blockNumber: Number(blockNumber),
      });

      // Obtener precio del gas cuando hay un nuevo bloque
      fetchGasPrice();
    }
  }, [blockNumber, fetchGasPrice]);

  /**
   * Efecto para actualizar el estado de conexión
   */
  useEffect(() => {
    setChainData((prev) => ({
      ...prev,
      isConnected,
    }));

    logger.info('Connection status updated', {
      isConnected,
    });
  }, [isConnected]);

  /**
   * Efecto para establecer el estado de carga
   * Se considera que está cargando mientras se obtiene el primer bloque
   */
  useEffect(() => {
    if (!isBlockLoading && blockNumber !== undefined) {
      setLoading(false);
    }
  }, [isBlockLoading, blockNumber]);

  /**
   * Función para refrescar manualmente los datos de la cadena
   * Útil para forzar una actualización sin esperar al siguiente bloque
   */
  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      logger.info('Manual refetch of chain data');

      // Obtener número de bloque actual
      const currentBlockNumber = await publicClient.getBlockNumber();

      // Obtener precio del gas
      const gasPrice = await publicClient.getGasPrice();

      // Actualizar estado
      setChainData((prev) => ({
        ...prev,
        blockNumber: Number(currentBlockNumber),
        gasPrice,
      }));

      logger.info('Chain data refetched successfully', {
        blockNumber: Number(currentBlockNumber),
        gasPrice: gasPrice.toString(),
      });

      setError(null);
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));

      logger.error('Failed to refetch chain data', {
        error: error.message,
      });

      setError(error);
    } finally {
      setLoading(false);
    }
  }, [publicClient]);

  return {
    // Datos de la cadena
    blockNumber: chainData.blockNumber,
    chainId: chainData.chainId,
    gasPrice: chainData.gasPrice,
    isConnected: chainData.isConnected,

    // Estado
    loading,
    error,

    // Funciones
    refetch,

    // Datos completos (para acceso directo)
    data: chainData,
  };
}
