'use client';

import { WagmiProvider, createConfig, http, createStorage } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechain } from './chains';

const chains = [andechain, mainnet, sepolia] as const;

// Configuración de WalletConnect (opcional)
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo-project-id';

// Storage personalizado para persistencia
const storage = createStorage({
  storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  key: 'andechain-wallet',
});

const wagmiConfig = createConfig({
  chains,
  connectors: [
    // Injected wallet (MetaMask, Brave, etc.)
    injected({ 
      shimDisconnect: true,
      target: 'metaMask',
    }),
    // WalletConnect para mobile y otras wallets
    walletConnect({
      projectId,
      metadata: {
        name: 'AndeChain',
        description: 'AndeChain DeFi Platform',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://andechain.com',
        icons: ['https://andechain.com/icon.png'],
      },
      showQrModal: true,
    }),
    // Coinbase Wallet
    coinbaseWallet({
      appName: 'AndeChain',
      appLogoUrl: 'https://andechain.com/icon.png',
    }),
  ],
  transports: {
    [andechain.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  storage,
  ssr: true,
});

const isWeb3ModalInitialized = false;

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

export { isWeb3ModalInitialized, wagmiConfig };

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig} reconnectOnMount={true}>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    </WagmiProvider>
  );
}
