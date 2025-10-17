'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechain } from './chains';
import { clearAllStorage } from './clear-storage';
import { cleanupLegacyStorage } from './storage-cleanup';

const chains = [andechain, mainnet, sepolia] as const;

/**
 * CONFIGURACIÓN MINIMALISTA PARA EVITAR CONFLICTOS:
 * 
 * ✅ Solo MetaMask (injected) - evita conflictos con otras wallets
 * ❌ Sin WalletConnect - causa conflictos de window.ethereum
 * ❌ Sin Coinbase Wallet - causa conflictos de window.ethereum
 * ❌ Sin persistencia en localStorage - causa QuotaExceededError
 * 
 * Problemas resueltos:
 * - QuotaExceededError: localStorage lleno por datos de múltiples wallets
 * - MetaMask error: "another Ethereum wallet extension also setting the global Ethereum provider"
 * - Conflictos de múltiples wallets compitiendo por window.ethereum
 */

// Ejecutar limpieza de storage obsoleto una sola vez
if (typeof window !== 'undefined') {
  clearAllStorage();
  cleanupLegacyStorage();
}

// Obtener URL del RPC de AndeChain desde la configuración de chain
const andechainRpcUrl = andechain.rpcUrls.default.http[0];

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
  // ❌ NO usar storage - causa QuotaExceededError
  // Wagmi manejará la reconexión automáticamente sin persistencia
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

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
