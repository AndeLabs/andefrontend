'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechainTestnet } from './chains';
import { useEffect } from 'react';

// Configuración mínima para debug
const chains = [andechainTestnet, mainnet] as const;

// Debug: Configuración mínima sin storage ni complicaciones
console.log('🔍 Initializing minimal Web3 config for debug...');

const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({
      shimDisconnect: false, // Simplificar
    }),
    walletConnect({
      projectId: 'c3e4c3a3b3e4c3a3b3e4c3a3b3e4c3a3', // Temporary project ID
      metadata: {
        name: 'AndeChain Nexus',
        description: 'Enterprise-grade DeFi Platform',
        url: 'http://localhost:3002',
        icons: ['http://localhost:3002/favicon.ico'],
      },
    }),
  ],
  transports: {
    [andechainTestnet.id]: http('/api/rpc'),
    [mainnet.id]: http(),
  },
  ssr: false,
});

console.log('✅ Web3 config created:', wagmiConfig);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 seconds for debug
      refetchOnWindowFocus: false,
      retry: 1, // Reduce retries for faster debug
    },
  },
});

export { wagmiConfig };

function WagmiConnectionHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log('🔍 WagmiConnectionHandler initialized');
    console.log('🔍 window.ethereum available:', !!window?.ethereum);
    
    // Simplificar - solo log básico
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log('✅ Ethereum provider detected');
    } else {
      console.log('❌ No Ethereum provider found - WalletConnect available as fallback');
    }

    // Debug: Log available connectors
    console.log('🔍 Available connectors:', wagmiConfig.connectors.map(c => c.name));
  }, []);

  return <>{children}</>;
}

export function Web3Provider({ children }: { children: React.ReactNode }) {
  console.log('🔍 Web3Provider rendering...');
  
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

// Debug: Log para verificar que el módulo se carga
console.log('📄 web3-provider.tsx loaded successfully');
