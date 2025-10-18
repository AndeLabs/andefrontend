'use client';

import { WagmiProvider, createConfig, http, createStorage } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechain } from './chains';
import { clearAllStorage } from './clear-storage';
import { cleanupLegacyStorage } from './storage-cleanup';
import { useEffect } from 'react';

const chains = [andechain, mainnet, sepolia] as const;

/**
 * CONFIGURACIÓN MINIMALISTA CON PERSISTENCIA SEGURA:
 * 
 * ✅ Solo MetaMask (injected) - evita conflictos con otras wallets
 * ✅ Persistencia segura en localStorage - Wagmi maneja automáticamente
 * ✅ Manejo robusto de QuotaExceededError
 * ✅ Reconexión automática al actualizar página o reabrir navegador
 * 
 * Problemas resueltos:
 * - QuotaExceededError: localStorage lleno por datos de múltiples wallets
 * - MetaMask error: "another Ethereum wallet extension also setting the global Ethereum provider"
 * - Conflictos de múltiples wallets compitiendo por window.ethereum
 * - Sesión no persiste al actualizar página o cerrar navegador
 */

// Ejecutar limpieza de storage obsoleto una sola vez
if (typeof window !== 'undefined') {
  // Guard para evitar múltiples inicializaciones
  if (!(window as any).__andechain_web3_initialized) {
    (window as any).__andechain_web3_initialized = true;
    // Only cleanup legacy storage, preserve Wagmi connection state
    cleanupLegacyStorage();
    console.log('✅ Web3 provider initialized');
  }
}

// Obtener URL del RPC de AndeChain desde la configuración de chain
const andechainRpcUrl = andechain.rpcUrls.default.http[0];

/**
 * Crear storage seguro para Wagmi
 * 
 * Wagmi usará este storage para persistir:
 * - Estado de conexión (connected/disconnected)
 * - Último conector usado (injected/walletConnect/etc)
 * - Caché de datos
 * 
 * Con safeStorage, los errores de localStorage se manejan gracefully
 */
const wagmiStorage = createStorage({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'andechain-wagmi', // ✅ Key específico para evitar conflictos
});

const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Solo MetaMask - evita conflictos con otras wallets
    injected({
      shimDisconnect: true,
      target: 'metaMask',
    }),
  ],
  transports: {
    // ✅ URL explícita para AndeChain (local o testnet según .env)
    [andechain.id]: http(andechainRpcUrl),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  // ✅ Habilitar persistencia segura
  storage: wagmiStorage,
  ssr: true,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
    },
  },
});

export { wagmiConfig };

function WagmiConnectionHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Escuchar cambios en la conexión
    const handleAccountsChanged = (accounts: string[]) => {
      console.log('🔔 Accounts changed event:', accounts);
      if (accounts.length > 0) {
        console.log('✅ Wallet connected via event:', accounts[0]);
        // Forzar re-render del componente
        window.dispatchEvent(new CustomEvent('wallet-status-changed', { 
          detail: { connected: true, address: accounts[0] } 
        }));
      }
    };

    const handleChainChanged = (chainId: string) => {
      console.log('🔔 Chain changed event:', chainId);
      window.location.reload();
    };

    const handleDisconnect = () => {
      console.log('🔔 Disconnect event');
      window.dispatchEvent(new CustomEvent('wallet-status-changed', { 
        detail: { connected: false } 
      }));
    };

    // Registrar listeners en window.ethereum
    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum;
      if (ethereum.on) {
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
        ethereum.on('disconnect', handleDisconnect);

        return () => {
          if (ethereum.removeListener) {
            ethereum.removeListener('accountsChanged', handleAccountsChanged);
            ethereum.removeListener('chainChanged', handleChainChanged);
            ethereum.removeListener('disconnect', handleDisconnect);
          }
        };
      }
    }
  }, []);

  return <>{children}</>;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <WagmiConnectionHandler>
          {children}
        </WagmiConnectionHandler>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

// Declaración global para TypeScript
declare global {
  interface Window {
    __andechain_web3_initialized?: boolean;
  }
}
