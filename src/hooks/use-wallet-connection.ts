'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useConnectors } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { andechainTestnet as andechain } from '@/lib/chains';

export type WalletConnectionState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'wrong-network'
  | 'switching-network'
  | 'error';

export interface UseWalletConnectionReturn {
  // Estado
  state: WalletConnectionState;
  address?: string;
  chainId?: number;
  isCorrectNetwork: boolean;
  
  // Acciones
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToAndeChain: () => Promise<void>;
  
  // Metadata
  connectors: ReturnType<typeof useConnectors>;
  error?: Error;
  isLoading: boolean;
}

/**
 * Hook simplificado para gestionar la conexión de wallet
 * Elimina complejidad innecesaria y previene conexiones duplicadas
 */
export function useWalletConnection(): UseWalletConnectionReturn {
  const { toast } = useToast();
  const [state, setState] = useState<WalletConnectionState>('disconnected');
  const [error, setError] = useState<Error | undefined>();
  
  // Refs to prevent infinite loops
  const isConnectingRef = useRef(false);
  const hasShownErrorRef = useRef(false);

  // Wagmi hooks
  const { 
    address, 
    isConnected, 
    isConnecting, 
    isDisconnected,
    chain 
  } = useAccount();
  
  const { 
    connect: wagmiConnect, 
    connectors,
    error: connectError,
    isPending: isConnectPending
  } = useConnect();
  
  const { disconnect: wagmiDisconnect } = useDisconnect();
  
  const { 
    switchChain, 
    isPending: isSwitchPending 
  } = useSwitchChain();

  const isCorrectNetwork = chain?.id === andechain.id;

  // Determinar estado basado en Wagmi
  useEffect(() => {
    if (isConnected && isCorrectNetwork) {
      setState('connected');
      setError(undefined);
      // Resetear flag cuando conecta exitosamente
      isConnectingRef.current = false;
      hasShownErrorRef.current = false;
    } else if (isConnected && !isCorrectNetwork) {
      setState('wrong-network');
    } else if (isConnecting || isConnectPending) {
      setState('connecting');
    } else if (isSwitchPending) {
      setState('switching-network');
    } else if (connectError) {
      setState('error');
      setError(connectError);
    } else if (isDisconnected) {
      setState('disconnected');
      setError(undefined);
      isConnectingRef.current = false;
    }
  }, [isConnected, isConnecting, isConnectPending, isSwitchPending, isCorrectNetwork, connectError, isDisconnected, chain]);

  // Manejar errores de conexión (solo mostrar una vez)
  useEffect(() => {
    if (connectError && !hasShownErrorRef.current) {
      // Ignorar el error "Connector already connected" ya que es benigno
      if (connectError.message?.includes('Connector already connected')) {
        return;
      }
      
      hasShownErrorRef.current = true;
      
      toast({
        title: 'Connection Error',
        description: connectError.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
      
      // Reset después de 3 segundos
      setTimeout(() => {
        hasShownErrorRef.current = false;
      }, 3000);
    }
  }, [connectError, toast]);

  // Cambiar a AndeChain (DECLARAR PRIMERO)
  const switchToAndeChain = useCallback(async () => {
    if (isSwitchPending) {
      console.log('⏳ Network switch already in progress');
      return;
    }

    try {
      await switchChain({ chainId: andechain.id });
      
      toast({
        title: '✅ Network Switched',
        description: `Connected to ${andechain.name}`,
      });
    } catch (err) {
      const error = err as Error;
      
      // Si el usuario rechaza el cambio, no mostrar error
      if (error.message?.includes('User rejected')) {
        return;
      }
      
      toast({
        title: '❌ Network Switch Failed',
        description: error.message || 'Failed to switch network',
        variant: 'destructive',
      });
    }
  }, [switchChain, isSwitchPending, toast]);

  // Función de conexión simplificada
  const connect = useCallback(async () => {
    // GUARD 1: Prevenir múltiples intentos simultáneos
    if (isConnectingRef.current) {
      return;
    }
    
    // GUARD 2: Si ya está conectado, no reconectar
    if (isConnected) {
      // Si está conectado pero en red incorrecta, cambiar red
      if (!isCorrectNetwork) {
        await switchToAndeChain();
      }
      return;
    }

    // GUARD 3: Verificar estados de Wagmi
    if (isConnecting || isConnectPending) {
      return;
    }
    
    // Marcar que estamos conectando
    isConnectingRef.current = true;

    try {
      setError(undefined);
      hasShownErrorRef.current = false;
      
      // Buscar conector MetaMask
      const metaMaskConnector = connectors.find(
        (c) => c.id === 'io.metamask' || c.id === 'metaMask' || c.name.toLowerCase().includes('metamask')
      );

      if (!metaMaskConnector) {
        throw new Error('MetaMask not found. Please install MetaMask extension.');
      }
      
      // Conectar con Wagmi (sin especificar chainId permite conectar en cualquier red)
      await wagmiConnect({
        connector: metaMaskConnector,
      });
      
      // Esperar un momento para que Wagmi actualice su estado interno
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Si conectó exitosamente pero está en red incorrecta, ofrecer cambiar
      if (chain?.id && chain.id !== andechain.id) {
        setTimeout(() => {
          switchToAndeChain();
        }, 1000);
      }
      
      // Resetear flag inmediatamente ya que conectó
      isConnectingRef.current = false;
    } catch (err) {
      const error = err as Error;
      
      // Ignorar error de "ya conectado" - es un falso positivo
      if (error.message?.includes('Connector already connected')) {
        isConnectingRef.current = false;
        return;
      }
      
      // Ignorar si el usuario rechazó
      if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
        toast({
          title: 'Connection Cancelled',
          description: 'You rejected the connection request',
        });
        isConnectingRef.current = false;
        return;
      }
      
      // Otros errores sí mostrarlos
      setError(error);
      
      toast({
        title: '❌ Connection Failed',
        description: error.message || 'Failed to connect wallet',
        variant: 'destructive',
      });
      
      // Resetear flag en caso de error
      isConnectingRef.current = false;
    }
  }, [isConnected, isConnecting, isConnectPending, isCorrectNetwork, connectors, wagmiConnect, toast, switchToAndeChain, chain]);

  // Función de desconexión
  const disconnect = useCallback(() => {
    try {
      // Reset flags
      isConnectingRef.current = false;
      hasShownErrorRef.current = false;
      
      wagmiDisconnect();
      setState('disconnected');
      setError(undefined);
      
      toast({
        title: 'Wallet Disconnected',
        description: 'Successfully disconnected from wallet',
      });
    } catch (err) {
      const error = err as Error;
      console.error('Disconnect error:', error);
      
      toast({
        title: 'Disconnect Error',
        description: error.message || 'Failed to disconnect wallet',
        variant: 'destructive',
      });
    }
  }, [wagmiDisconnect, toast]);

  return {
    // Estado
    state,
    address,
    chainId: chain?.id,
    isCorrectNetwork,
    
    // Acciones
    connect,
    disconnect,
    switchToAndeChain,
    
    // Metadata
    connectors,
    error,
    isLoading: isConnecting || isConnectPending || isSwitchPending,
  };
}