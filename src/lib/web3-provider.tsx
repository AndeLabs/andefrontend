'use client';

import { WagmiProvider, createConfig, http } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { andechainTestnet } from './chains';
import { useEffect } from 'react';

// Production-ready chain configuration
const chains = [andechainTestnet, mainnet] as const;

// Helper to add AndeChain to MetaMask or compatible wallet
const addAndeChainToWallet = async () => {
  if (typeof window === 'undefined') return false;
  
  try {
    // Try to get ethereum provider - handle multiple wallet conflicts
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.error('No Ethereum provider found. Please install MetaMask or another Web3 wallet.');
      return false;
    }

    // Validate RPC URLs
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
    // -32602 = Invalid params, -32603 = Internal error, 4902 = Chain not found
    if (error.code === 4902) {
      console.log('Chain is not yet added to MetaMask');
    } else if (error.code === 4001) {
      console.log('User rejected adding AndeChain');
    } else {
      console.error('Error adding AndeChain to wallet:', error.message || error);
    }
    return false;
  }
};

// Create wagmi configuration
const getWagmiConfig = () => {
  // Prioritize MetaMask over other injected wallets (like Yoroi)
  // This prevents wallet conflicts when multiple extensions are installed
  const connectors: any[] = [
    injected({ 
      shimDisconnect: false,
      target: 'metaMask', // Explicitly target MetaMask first
    }),
  ];
  
  // Only add WalletConnect if project ID is provided and valid
  const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;
  if (walletConnectProjectId && 
      walletConnectProjectId.length > 20 && 
      !walletConnectProjectId.includes('c3e4c3a3b3e4c3a3b3e4c3a3b3e4c3a3')) {
    
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

  // Get RPC URL for wagmi - must be full HTTPS URL, not relative path
  const andeRpcUrl = process.env.NEXT_PUBLIC_RPC_HTTP || 'http://189.28.81.202:8545';

  return createConfig({
    chains,
    connectors,
    transports: {
      [andechainTestnet.id]: http(andeRpcUrl),
      [mainnet.id]: http(),
    },
    ssr: false,
  });
};

const wagmiConfig = getWagmiConfig();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 3,
    },
  },
});

export { wagmiConfig, addAndeChainToWallet };

function WagmiConnectionHandler({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Auto-add AndeChain to supported wallets
    const handleChainChanged = (chainId: string) => {
      try {
        const numericChainId = parseInt(chainId, 16);
        if (numericChainId !== andechainTestnet.id && window.ethereum) {
          // Suggest switching to AndeChain if on wrong network
          setTimeout(() => addAndeChainToWallet(), 1000);
        }
      } catch (error) {
        // Silently handle chain change errors in production
        if (process.env.NODE_ENV === 'development') {
          console.warn('Chain change handler error:', error);
        }
      }
    };

    if (typeof window !== 'undefined' && window.ethereum) {
      const ethereum = window.ethereum;
      ethereum.on?.('chainChanged', handleChainChanged);
      return () => {
        ethereum.removeListener?.('chainChanged', handleChainChanged);
      };
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
