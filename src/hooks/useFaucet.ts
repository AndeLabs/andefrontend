'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

/**
 * Configuración del Faucet
 */
const FAUCET_CONFIG = {
  URL: process.env.NEXT_PUBLIC_FAUCET_URL || 'http://localhost:3001',
  AMOUNT: 10, // ANDE tokens
  TIMEOUT: 30000, // 30 segundos
} as const;

/**
 * Respuesta del servidor faucet al solicitar tokens
 */
export interface FaucetRequestResponse {
  success: boolean;
  txHash?: string;
  amount?: number;
  message?: string;
  error?: string;
}

/**
 * Respuesta del servidor faucet al verificar cooldown
 */
export interface FaucetCooldownResponse {
  canRequest: boolean;
  remainingTime: number; // en segundos
  lastRequestTime?: number;
  message?: string;
}

/**
 * Estado del faucet
 */
export interface FaucetStatus {
  balance: string; // en wei
  faucetAddress: string;
  status: 'active' | 'inactive' | 'error';
  message?: string;
}

/**
 * Hook para interactuar con el servidor faucet
 * Maneja solicitudes de tokens, verificación de cooldown y estado del faucet
 */
export function useFaucet() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Realiza una solicitud HTTP al servidor faucet con manejo de errores
   */
  const fetchFromFaucet = useCallback(
    async <T,>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<T> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FAUCET_CONFIG.TIMEOUT);

      try {
        const response = await fetch(`${FAUCET_CONFIG.URL}${endpoint}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        return await response.json();
      } catch (err: any) {
        clearTimeout(timeoutId);

        // Manejo de errores específicos
        if (err.name === 'AbortError') {
          throw new Error('Request timeout - faucet server is not responding');
        }

        throw err;
      }
    },
    []
  );

  /**
   * Solicita tokens del faucet para una dirección
   * @param address - Dirección Ethereum a la que enviar los tokens
   * @returns Objeto con éxito, hash de transacción y cantidad
   */
  const requestTokens = useCallback(
    async (address: string): Promise<FaucetRequestResponse> => {
      if (!address) {
        const err = new Error('Address is required');
        setError(err);
        logger.error('Faucet request error: address is required');
        throw err;
      }

      // Validar formato de dirección Ethereum
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        const err = new Error('Invalid Ethereum address format');
        setError(err);
        logger.error('Faucet request error: invalid address format', { address });
        throw err;
      }

      setLoading(true);
      setError(null);

      try {
        logger.info('Requesting tokens from faucet', {
          address,
          amount: FAUCET_CONFIG.AMOUNT,
        });

        const response = await fetchFromFaucet<FaucetRequestResponse>(
          '/api/request-tokens',
          {
            method: 'POST',
            body: JSON.stringify({
              address,
              amount: FAUCET_CONFIG.AMOUNT,
            }),
          }
        );

        if (response.success) {
          logger.info('Faucet request successful', {
            txHash: response.txHash,
            amount: response.amount,
          });

          toast({
            title: 'Tokens Requested',
            description: `Successfully requested ${response.amount} ANDE tokens. Transaction: ${response.txHash?.slice(0, 10)}...`,
          });
        } else {
          throw new Error(response.message || 'Failed to request tokens');
        }

        return response;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        logger.error('Faucet request failed', {
          address,
          error: error.message,
        });

        toast({
          variant: 'destructive',
          title: 'Request Failed',
          description: error.message,
        });

        throw error;
      } finally {
        setLoading(false);
      }
    },
    [fetchFromFaucet, toast]
  );

  /**
   * Verifica si una dirección puede solicitar tokens (cooldown)
   * @param address - Dirección Ethereum a verificar
   * @returns Objeto con estado de solicitud y tiempo restante
   */
  const checkCooldown = useCallback(
    async (address: string): Promise<FaucetCooldownResponse> => {
      if (!address) {
        const err = new Error('Address is required');
        setError(err);
        logger.error('Cooldown check error: address is required');
        throw err;
      }

      // Validar formato de dirección Ethereum
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        const err = new Error('Invalid Ethereum address format');
        setError(err);
        logger.error('Cooldown check error: invalid address format', { address });
        throw err;
      }

      try {
        logger.info('Checking faucet cooldown', { address });

        const response = await fetchFromFaucet<FaucetCooldownResponse>(
          `/api/check-cooldown?address=${address}`,
          { method: 'GET' }
        );

        logger.info('Cooldown check completed', {
          canRequest: response.canRequest,
          remainingTime: response.remainingTime,
        });

        return response;
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        logger.error('Cooldown check failed', {
          address,
          error: error.message,
        });

        throw error;
      }
    },
    [fetchFromFaucet]
  );

  /**
   * Obtiene el estado actual del faucet
   * @returns Objeto con balance, dirección y estado del faucet
   */
  const getFaucetStatus = useCallback(async (): Promise<FaucetStatus> => {
    setLoading(true);
    setError(null);

    try {
      logger.info('Fetching faucet status');

      const response = await fetchFromFaucet<FaucetStatus>('/api/status', {
        method: 'GET',
      });

      logger.info('Faucet status retrieved', {
        status: response.status,
        balance: response.balance,
      });

      return response;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      logger.error('Failed to fetch faucet status', {
        error: error.message,
      });

      // Retornar estado de error en lugar de lanzar
      return {
        balance: '0',
        faucetAddress: '',
        status: 'error',
        message: error.message,
      };
    } finally {
      setLoading(false);
    }
  }, [fetchFromFaucet]);

  /**
   * Limpia el estado de error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Funciones
    requestTokens,
    checkCooldown,
    getFaucetStatus,
    clearError,

    // Estado
    loading,
    error,

    // Configuración
    faucetAmount: FAUCET_CONFIG.AMOUNT,
    faucetUrl: FAUCET_CONFIG.URL,
  };
}
