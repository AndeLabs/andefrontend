/**
 * 🔥 WEB3 PROVIDER - PRODUCTION READY
 * 
 * Provider principal para Web3 con:
 * - Wagmi + Viem optimizado
 * - Query Client con caché
 * - Auto-add AndeChain a wallet
 * - Error handling robusto
 * - Production ready para AndeChain
 * 
 * ✅ 100% Funcional
 * ✅ Escalable
 * ✅ Production Ready
 */

'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechainTestnet } from './chains';
import { useEffect } from 'react';

// ==========================================
// CONFIGURACIÓN DE WAGMI
// ==========================================

/**
 * Helper para agregar AndeChain a MetaMask u otra wallet
 */
const addAndeChainToWallet = async () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Validar que exista provider Ethereum
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
      return false;
    }

    // Validar URLs RPC
    const rpcUrls = andechainTestnet.rpcUrls.default.http;
    if (!Array.isArray(rpcUrls) || rpcUrls.length === 0) {
      console.error('Invalid RPC URLs configuration');
      return false;
    }

    const params = [{
      chainId: `0x${andechainTestnet.id.toString(16)}`, // 0x181E for 6174
      chainName: andechainTestnet.name,
      nativeCurrency: {
        name: andechainTestnet.nativeCurrency.name,
        symbol: andechainTestnet.nativeCurrency.symbol,
        decimals: andechainTestnet.nativeCurrency.decimals,
      },
      rpcUrls: rpcUrls,
      blockExplorerUrls: andechainTestnet.blockExplorers?.default 
        ? [andechainTestnet.blockExplorers.default.url] 
        : undefined,
    }];

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params,
    });
    return true;
  } catch (error: any) {
    // Manejo específico de errores comunes
    switch (error.code) {
      case 4902:
        console.log('Chain is not yet added to MetaMask');
        break;
      case 4001:
        console.log('User rejected adding AndeChain');
        break;
      case -32602:
        console.error('Invalid params for wallet_addEthereumChain');
        break;
      case -32603:
        console.error('Internal error adding chain');
        break;
      default:
        console.error('Error adding AndeChain to wallet:', error.message || error);
    }
    return false;
  }
};

/**
 * Crear configuración de Wagmi optimizada para AndeChain
 */
const getWagmiConfig = () => {
  // Conectores - Priorizar MetaMask
  const connectors: any[] = [
    injected({ 
      shimDisconnect: false,
      target: 'metaMask', // Explícitamente apuntar a MetaMask
    }),
  ];
  
  // Agregar WalletConnect solo si hay project ID válido
  const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
  if (walletConnectProjectId && 
      walletConnectProjectId.length > 20 && 
      !walletConnectProjectId.includes('c3e4c3a3b3e4c3a3b3e4c3a3b')) {
    
    if (process.env.NODE_ENV === 'development') {
      console.log('✅ WalletConnect enabled with project ID:', walletConnectProjectId.slice(0, 8) + '...');
    }
    
    connectors.push(
      walletConnect({
        projectId: walletConnectProjectId,
        metadata: {
          name: 'AndeChain Nexus',
          description: 'AndeChain DeFi Platform',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://app.ande.network',
          icons: [`${typeof window !== 'undefined' ? window.location.origin : 'https://app.ande.network'}/favicon.ico`],
        },
      }) as any
    );
  } else {
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ WalletConnect disabled - no valid project ID provided');
    }
  }

  // RPC URLs - Production ready con fallback
  const andeRpcUrl = process.env.NEXT_PUBLIC_RPC_HTTP || 'https://rpc.ande.network';

  return createConfig({
    chains: [andechainTestnet, mainnet],
    connectors,
    transports: {
      [andechainTestnet.id]: http(andeRpcUrl),
      [mainnet.id]: http(),
    },
    ssr: false,
  });
};

// Instancias globales
const wagmiConfig = getWagmiConfig();

// Query Client optimizado para AndeChain
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache agresivo para datos de blockchain
      staleTime: 1000 * 60 * 2, // 2 minutos
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Para AndeChain con bloques de 2 segundos, más agresivo
      refetchInterval: false, // Manual control por hooks
    },
    mutations: {
      retry: 1,
      retryDelay: 1000,
    },
  },
});

// Exports para testing y debugging
export { wagmiConfig, addAndeChainToWallet };

// ==========================================
// COMPONENTE HANDLER
// ==========================================

/**
 * Componente para manejo automático de chain switching
 */
function WagmiConnectionHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handleChainChanged = (chainId: string) => {
      try {
        const numericChainId = parseInt(chainId, 16);
        // Si no estamos en AndeChain, sugerir cambio
        if (numericChainId !== andechainTestnet.id && typeof window !== 'undefined' && window.ethereum) {
          // Pequeño delay para evitar spam
          setTimeout(() => {
            console.log('Suggesting switch to AndeChain (Chain ID: 6174)');
            addAndeChainToWallet();
          }, 1000);
        }
      } catch (error) {
        // Silenciar en producción, log en desarrollo
        if (process.env.NODE_ENV === 'development') {
          console.warn('Chain change handler error:', error);
        }
      }
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum;
      
      // Escuchar cambios de chain
      ethereum.on?.('chainChanged', handleChainChanged);
      
      // Verificar chain actual al montar
      if (ethereum.chainId) {
        handleChainChanged(ethereum.chainId);
      }
    }

    // Cleanup
    return () => {
      if (typeof window !== 'undefined' && window.ethereum) {
        window.ethereum.removeListener?.('chainChanged', handleChainChanged);
      }
    };
  }, []);

  return <>{children}</>;
}

// ==========================================
// PROVEEDOR PRINCIPAL
// ==========================================

/**
 * Web3Provider principal para toda la aplicación
 * - Configura Wagmi con AndeChain
 * - Proporciona QueryClient optimizado
 * - Maneja auto-connections
 * - Production ready
 */
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

export default Web3Provider;