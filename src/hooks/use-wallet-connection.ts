'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAccount, useConnect, useDisconnect, useSwitchChain, useConnectors } from 'wagmi';
import { useToast } from '@/hooks/use-toast';
import { andechain } from '@/lib/chains';
import { logger } from '@/lib/logger';

// Tipos para detección de conflictos
interface WalletConflictInfo {
  hasMetaMask: boolean;
  hasOtherWallets: boolean;
  hasMultipleProviders: boolean;
  ethereumProvider?: string;
  web3Provider?: string;
}

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

/**
 * NOTA: Wagmi maneja automáticamente la persistencia de sesión
 * 
 * ✅ Wagmi persiste automáticamente:
 * - Estado de conexión (connected/disconnected)
 * - Último conector usado (injected/walletConnect/etc)
 * - Caché de datos
 * 
 * ❌ NO usamos localStorage manual para evitar:
 * - Conflictos con la persistencia de Wagmi
 * - QuotaExceededError por datos duplicados
 * - Sincronización de estado incorrecta
 */

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
    const connectionInProgressRef = useRef(false);
    const connectionIdRef = useRef<string | null>(null);
    const walletConflictDetectedRef = useRef(false);

   // Función para detectar conflictos de wallets
   const detectWalletConflicts = useCallback((): WalletConflictInfo => {
     if (typeof window === 'undefined') {
       return {
         hasMetaMask: false,
         hasOtherWallets: false,
         hasMultipleProviders: false,
       };
     }

     const hasMetaMask = !!window.ethereum?.isMetaMask;
     const hasOtherWallets = !!window.ethereum && !window.ethereum.isMetaMask;
     const hasMultipleProviders = !!(window.ethereum && (window as any).web3);

     const conflictInfo: WalletConflictInfo = {
       hasMetaMask,
       hasOtherWallets,
       hasMultipleProviders,
       ethereumProvider: window.ethereum?.constructor?.name,
       web3Provider: (window as any).web3?.constructor?.name,
     };

     // Solo mostrar warning una vez
     if ((hasOtherWallets || hasMultipleProviders) && !walletConflictDetectedRef.current) {
       walletConflictDetectedRef.current = true;
       logger.warn('Multiple wallet extensions detected', conflictInfo);
       toast({
         variant: 'destructive',
         title: 'Multiple Wallet Extensions Detected',
         description: 'Please disable other wallet extensions and keep only MetaMask for best experience.',
         duration: 10000,
       });
     }

     return conflictInfo;
   }, [toast]);

    // Determinar estado actual
    useEffect(() => {
     if (isConnecting) {
       setState('connecting');
     } else if (isSwitching) {
       setState('switching-network');
     } else if (isConnected && chain) {
       if (chain.id === andechain.id) {
         setState('connected');
         // ✅ Wagmi maneja automáticamente la persistencia
         // No necesitamos guardar en localStorage
       } else {
         setState('wrong-network');
       }
     } else if (error || connectError) {
       setState('error');
     } else {
       setState('disconnected');
     }
   }, [isConnected, isConnecting, isSwitching, chain, error, connectError, address]);

    // Eager connection: Wagmi maneja automáticamente la reconexión
    // Solo necesitamos verificar que se intente una sola vez
    useEffect(() => {
      if (eagerConnectionAttemptedRef.current || isConnected || isConnecting || connectionInProgressRef.current) {
        return;
      }

      eagerConnectionAttemptedRef.current = true;

      // ✅ Wagmi intentará reconectar automáticamente usando su persistencia
      // Solo necesitamos esperar a que Wagmi complete el intento
      if (typeof window !== 'undefined') {
        logger.info('Eager connection: Wagmi will attempt to reconnect using persisted state');
        
        // Esperar un poco para que Wagmi intente la reconexión
        setTimeout(() => {
          if (!isConnected && !isConnecting) {
            logger.info('No persisted connection found or reconnection failed');
          }
        }, 1000);
      }
   }, [isConnected, isConnecting]);



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

       logger.info('Attempting to switch to AndeChain', {
         chainId: andechain.id,
         chainName: andechain.name,
         rpcUrl: andechain.rpcUrls.default.http[0],
       });

       await switchChain({ chainId: andechain.id });
       
       toast({
         title: 'Network Switched',
         description: `Connected to ${andechain.name}`,
       });
       
       logger.info('Switched to AndeChain successfully', { chainId: andechain.id });
       
     } catch (err: any) {
       logger.error('Switch network error:', {
         message: err?.message,
         code: err?.code,
         chainId: andechain.id,
         rpcUrl: andechain.rpcUrls.default.http[0],
       });
       setError(err);
       
       // Error 4902: Chain no agregada
       if (err.code === 4902 || err.message?.includes('Unrecognized chain')) {
         logger.info('Chain not recognized, attempting to add to wallet');
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

     // Función de conexión mejorada con prevención de duplicados robusta
     const connect = useCallback(async (connectorId?: string) => {
       // Generar ID único para esta conexión
       const connectionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
       connectionIdRef.current = connectionId;

       // Prevenir conexiones duplicadas
       if (connectionInProgressRef.current) {
         logger.warn('Connection already in progress, ignoring duplicate request', {
           currentConnectionId: connectionIdRef.current,
           attemptedConnectionId: connectionId,
           timestamp: Date.now(),
         });
         return;
       }

       connectionInProgressRef.current = true;

       try {
         setError(undefined);
         
         // Detectar conflictos de wallets
         const conflictInfo = detectWalletConflicts();
         
         // Log de diagnóstico: información de AndeChain
         logger.info('Attempting wallet connection', {
           connectionId,
           chainId: andechain.id,
           chainName: andechain.name,
           rpcUrl: andechain.rpcUrls.default.http[0],
           isLocalChain: process.env.NEXT_PUBLIC_USE_LOCAL_CHAIN === 'true',
           connectorId,
           walletConflicts: conflictInfo,
           timestamp: Date.now(),
         });
        
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

        // Verificar que el connectionId no cambió durante la espera
        if (connectionIdRef.current !== connectionId) {
          logger.warn('Connection ID changed, aborting stale connection', {
            expectedId: connectionId,
            currentId: connectionIdRef.current,
          });
          return;
        }

         await wagmiConnect({ connector });
         
         // ✅ Wagmi maneja automáticamente la persistencia del conector
         // No necesitamos guardar en localStorage
         
         logger.info('Wallet connected successfully', { 
           connectionId,
           connectorId: connector.id,
           chainId: andechain.id,
         });
        
       } catch (err: any) {
         logger.error('Connection error:', {
           connectionId,
           message: err?.message,
           code: err?.code,
           chainId: andechain.id,
           rpcUrl: andechain.rpcUrls.default.http[0],
           timestamp: Date.now(),
         });
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
         } else if (err.message?.includes('AndeChain Local')) {
           // Error específico de conexión a AndeChain Local
           toast({
             variant: 'destructive',
             title: 'Cannot Connect to AndeChain Local',
             description: 'Make sure the local node is running on http://localhost:8545',
           });
         } else if (err.message?.includes('already pending')) {
           // Error de solicitud duplicada de MetaMask
           toast({
             variant: 'destructive',
             title: 'Request Already Pending',
             description: 'A wallet request is already in progress. Please wait or try again.',
           });
         } else {
           toast({
             variant: 'destructive',
             title: 'Connection Failed',
             description: err.message || 'Failed to connect wallet',
           });
         }
         
         throw err;
       } finally {
         // Solo resetear si es el mismo connectionId
         if (connectionIdRef.current === connectionId) {
           connectionInProgressRef.current = false;
           connectionIdRef.current = null;
         }
       }
     }, [connectors, wagmiConnect, toast, switchToAndeChain, detectWalletConflicts]);

   // Función de desconexión mejorada
   const disconnect = useCallback(() => {
     wagmiDisconnect();
     switchAttemptRef.current = false;
     setError(undefined);
     
     // ✅ Wagmi maneja automáticamente la limpieza de persistencia
     // No necesitamos limpiar localStorage manualmente
     
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

   // Cleanup cuando el componente se desmonta
   useEffect(() => {
     return () => {
       connectionInProgressRef.current = false;
       connectionIdRef.current = null;
       if (connectionTimeoutRef.current) {
         clearTimeout(connectionTimeoutRef.current);
       }
     };
   }, []);

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
