'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechanTestnet } from './chains';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

if (!projectId) {
  console.error('NEXT_PUBLIC_WC_PROJECT_ID is not set. Please set it in your environment variables.');
}

const metadata = {
  name: 'AndeChain Nexus',
  description: 'Enterprise-grade Web3 DeFi Application',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886'],
};

const chains = [andechanTestnet, mainnet, sepolia] as const;

const wagmiConfig = createConfig({
  chains,
  transports: {
    [andechanTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
  ssr: true,
});

if (projectId) {
    createWeb3Modal({
      wagmiConfig,
      projectId,
      metadata,
      defaultChain: andechanTestnet
    });
}

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    </WagmiProvider>
  );
}
