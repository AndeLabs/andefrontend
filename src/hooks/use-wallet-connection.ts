'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useConnectors } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { andechain } from '@/lib/chains';
import { logger } from '@/lib/logger';

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
  connect: (connectorId?: string) => Promise<void>;
  disconnect: () => void;
  switchToAndeChain: () => Promise<void>;
  
  // Metadata
  connectors: ReturnType<typeof useConnectors>;
  error?: Error;
  isLoading: boolean;
}

// Storage keys para persistencia
const STORAGE_KEYS = {
  WALLET_CONNECTED: 'andechain-wallet-connected',
  WALLET_ADDRESS: 'andechain-wallet-address',
  WALLET_CONNECTOR: 'andechain-wallet-connector',
} as const;

export function useWalletConnection(): UseWalletConnectionReturn {
  const { address, isConnected, chain } = useAccount();
  const { connect: wagmiConnect, isPending: isConnecting, error: connectError } = useConnect();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const connectors = useConnectors();
  const { toast } = useToast();
  
  const [state, setState] = useState<WalletConnectionState>('disconnected');
  const [error, setError] = useState<Error | undefined>();
  const switchAttemptRef = useRef(false);
  const connectionTimeoutRef = useRef<NodeJS.Timeout>();
  const eagerConnectionAttemptedRef = useRef(false);

  // Determinar estado actual
  useEffect(() => {
    if (isConnecting) {
      setState('connecting');
    } else if (isSwitching) {
      setState('switching-network');
    } else if (isConnected && chain) {
      if (chain.id === andechain.id) {
        setState('connected');
        // Guardar estado de conexión exitosa
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTED, 'true');
          if (address) {
            localStorage.setItem(STORAGE_KEYS.WALLET_ADDRESS, address);
          }
        }
      } else {
        setState('wrong-network');
      }
    } else if (error || connectError) {
      setState('error');
    } else {
      setState('disconnected');
    }
  }, [isConnected, isConnecting, isSwitching, chain, error, connectError, address]);

  // Eager connection: Intentar reconectar automáticamente si estaba conectado previamente
  useEffect(() => {
    if (eagerConnectionAttemptedRef.current || isConnected || isConnecting) {
      return;
    }

    eagerConnectionAttemptedRef.current = true;

    // Verificar si había una conexión previa
    if (typeof window !== 'undefined') {
      const wasConnected = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTED) === 'true';
      const savedConnectorId = localStorage.getItem(STORAGE_KEYS.WALLET_CONNECTOR);

      if (wasConnected) {
        logger.info('Attempting eager connection with saved connector', {
          connectorId: savedConnectorId,
        });

        // Intentar reconectar con el conector guardado o MetaMask por defecto
        const targetConnectorId = savedConnectorId || 'injected';
        const connector = connectors.find(c => c.id === targetConnectorId);

        if (connector) {
          try {
            wagmiConnect({ connector });
          } catch (err: any) {
            logger.warn('Eager connection failed', { error: err?.message });
            // Limpiar estado si falla
            localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED);
            localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTOR);
          }
        }
      }
    }
  }, [isConnected, isConnecting, connectors, wagmiConnect]);



  // Timeout para conexiones colgadas
  useEffect(() => {
    if (isConnecting || isSwitching) {
      connectionTimeoutRef.current = setTimeout(() => {
        logger.warn('Connection timeout - resetting state');
        setError(new Error('Connection timeout. Please try again.'));
        toast({
          variant: 'destructive',
          title: 'Connection Timeout',
          description: 'The connection is taking too long. Please try again.',
        });
      }, 30000); // 30 segundos
    } else {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    }

    return () => {
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
      }
    };
  }, [isConnecting, isSwitching, toast]);

  // Función de switch mejorada (definida primero para usarla en connect)
  const switchToAndeChain = useCallback(async () => {
    try {
      setError(undefined);
      
      if (!switchChain) {
        throw new Error('Switch chain not available');
      }

      await switchChain({ chainId: andechain.id });
      
      toast({
        title: 'Network Switched',
        description: `Connected to ${andechain.name}`,
      });
      
      logger.info('Switched to AndeChain successfully');
      
    } catch (err: any) {
      logger.error('Switch network error:', err);
      setError(err);
      
      // Error 4902: Chain no agregada
      if (err.code === 4902 || err.message?.includes('Unrecognized chain')) {
        await addAndeChainToWallet();
      } else if (err.code === 4001) {
        toast({
          title: 'Switch Rejected',
          description: 'You rejected the network switch request.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Switch Failed',
          description: err.message || 'Failed to switch network',
        });
      }
      
      throw err;
    }
  }, [switchChain, toast]);

  // Función de conexión mejorada
  const connect = useCallback(async (connectorId?: string) => {
    try {
      setError(undefined);
      
      // Buscar conector - prioridad a MetaMask (injected)
      const connector = connectorId 
        ? connectors.find(c => c.id === connectorId)
        : connectors.find(c => c.id === 'injected') || 
          connectors.find(c => c.name.toLowerCase().includes('metamask'));

      if (!connector) {
        throw new Error('No wallet connector found');
      }

      // Verificar si MetaMask está instalado (solo para injected)
      if (connector.id === 'injected' && typeof window !== 'undefined' && !window.ethereum) {
        throw new Error('MetaMask not installed');
      }

      await wagmiConnect({ connector });
      
      // Guardar conector usado para reconexión futura
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.WALLET_CONNECTOR, connector.id);
      }
      
      logger.info('Wallet connected successfully', { connectorId: connector.id });
      
    } catch (err: any) {
      logger.error('Connection error:', err);
      setError(err);
      
      // Manejo de errores específicos
      if (err.message?.includes('MetaMask not installed')) {
        toast({
          variant: 'destructive',
          title: 'MetaMask Not Installed',
          description: 'Please install MetaMask to continue.',
        });
        // Abrir descarga en nueva pestaña
        window.open('https://metamask.io/download/', '_blank');
      } else if (err.code === 4001) {
        toast({
          title: 'Connection Rejected',
          description: 'You rejected the connection request.',
        });
      } else if (err.message?.includes('Connector already connected')) {
        // Ya está conectado, intentar switch
        await switchToAndeChain();
      } else {
        toast({
          variant: 'destructive',
          title: 'Connection Failed',
          description: err.message || 'Failed to connect wallet',
        });
      }
      
      throw err;
    }
  }, [connectors, wagmiConnect, toast, switchToAndeChain]);

  // Función de desconexión mejorada
  const disconnect = useCallback(() => {
    wagmiDisconnect();
    switchAttemptRef.current = false;
    setError(undefined);
    
    // Limpiar localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTED);
      localStorage.removeItem(STORAGE_KEYS.WALLET_ADDRESS);
      localStorage.removeItem(STORAGE_KEYS.WALLET_CONNECTOR);
    }
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected.',
    });
    
    logger.info('Wallet disconnected');
  }, [wagmiDisconnect, toast]);

  // Auto-switch a AndeChain cuando se conecta a red incorrecta
  useEffect(() => {
    if (isConnected && chain && chain.id !== andechain.id && !switchAttemptRef.current) {
      switchAttemptRef.current = true;
      switchToAndeChain().finally(() => {
        // Reset después de 5 segundos para permitir reintentos manuales
        setTimeout(() => {
          switchAttemptRef.current = false;
        }, 5000);
      });
    }
  }, [isConnected, chain, switchToAndeChain]);

  // Agregar AndeChain a la wallet
  const addAndeChainToWallet = async () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('Ethereum provider not found');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${andechain.id.toString(16)}`,
            chainName: andechain.name,
            nativeCurrency: {
              name: andechain.nativeCurrency.name,
              symbol: andechain.nativeCurrency.symbol,
              decimals: andechain.nativeCurrency.decimals,
            },
            rpcUrls: andechain.rpcUrls.default.http,
            blockExplorerUrls: andechain.blockExplorers?.default.url 
              ? [andechain.blockExplorers.default.url] 
              : undefined,
          },
        ],
      });

      toast({
        title: 'Network Added',
        description: `${andechain.name} has been added to your wallet.`,
      });
      
      logger.info('AndeChain added to wallet successfully');
      
    } catch (err: any) {
      logger.error('Add network error:', err);
      
      if (err.code === 4001) {
        toast({
          title: 'Request Rejected',
          description: 'You rejected the request to add AndeChain.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Failed to Add Network',
          description: err.message || 'Could not add AndeChain to your wallet',
        });
      }
      
      throw err;
    }
  };

  return {
    state,
    address: address as string | undefined,
    chainId: chain?.id,
    isCorrectNetwork: chain?.id === andechain.id,
    connect,
    disconnect,
    switchToAndeChain,
    connectors,
    error: (error || connectError) as Error | undefined,
    isLoading: isConnecting || isSwitching,
  };
}
