'use client';

import { createWeb3Modal } from '@web3modal/wagmi/react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechanTestnet } from './chains';

const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

let isWeb3ModalInitialized = false;
if (projectId) {
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

  createWeb3Modal({
    wagmiConfig,
    projectId,
    metadata,
    defaultChain: andechanTestnet
  });
  isWeb3ModalInitialized = true;
} else {
  console.warn("NEXT_PUBLIC_WC_PROJECT_ID is not set. Web3Modal will not be initialized.");
}

const queryClient = new QueryClient();

export { isWeb3ModalInitialized };

export function Web3Provider({ children }: { children: React.ReactNode }) {
  const wagmiConfig = createConfig({
    chains: [andechanTestnet, mainnet, sepolia],
    transports: {
      [andechanTestnet.id]: http(),
      [mainnet.id]: http(),
      [sepolia.id]: http(),
    },
    ssr: true,
  });

  return (
    <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    </WagmiProvider>
  );
}
