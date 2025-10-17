'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, CheckCircle2, AlertCircle, Loader2, Network } from 'lucide-react';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { andechain } from '@/lib/chains';

interface MetaMaskConnectProps {
  onConnected?: (address: string) => void;
  showCard?: boolean;
}

export function MetaMaskConnect({ onConnected, showCard = true }: MetaMaskConnectProps) {
  const {
    state,
    address,
    isCorrectNetwork,
    connect,
    disconnect,
    switchToAndeChain,
    error,
    isLoading,
  } = useWalletConnection();

  // Notificar cuando se conecta correctamente
  useEffect(() => {
    if (state === 'connected' && address && onConnected) {
      onConnected(address);
    }
  }, [state, address, onConnected]);

  const handleConnect = async () => {
    try {
      await connect();
    } catch (err) {
      // Error ya manejado en el hook
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const handleSwitchNetwork = async () => {
    try {
      await switchToAndeChain();
    } catch (err) {
      // Error ya manejado en el hook
    }
  };

  // Renderizado compacto (sin card)
  if (!showCard) {
    // Estado: Red incorrecta
    if (state === 'wrong-network' || state === 'switching-network') {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-sm">Wrong Network</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSwitchNetwork}
            disabled={state === 'switching-network'}
          >
            {state === 'switching-network' ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Switching...
              </>
            ) : (
              'Switch Network'
            )}
          </Button>
        </div>
      );
    }
    
    // Estado: Conectado correctamente
    if (state === 'connected' && address) {
      return (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>
      );
    }

    // Estado: Desconectado o conectando
    return (
      <Button 
        onClick={handleConnect} 
        disabled={isLoading}
        size="lg"
        className="w-full"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            {state === 'connecting' ? 'Connecting...' : 'Loading...'}
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-5 w-5" />
            Connect Wallet
          </>
        )}
      </Button>
    );
  }

  // Renderizado con card completo
  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600">
          <Wallet className="h-10 w-10 text-white" />
        </div>
        <CardTitle>Connect Your Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to access AndeChain
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Error state */}
        {state === 'error' && error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-500/50 bg-red-500/10 p-4">
            <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium">Connection Error</p>
              <p className="text-xs text-muted-foreground">
                {error.message || 'An error occurred'}
              </p>
            </div>
          </div>
        )}

        {/* MetaMask not installed */}
        {typeof window !== 'undefined' && !window.ethereum && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
              <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Wallet not detected</p>
                <p className="text-xs text-muted-foreground">
                  Install a Web3 wallet extension to continue
                </p>
              </div>
            </div>
            <Button 
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
              className="w-full"
            >
              Install MetaMask
            </Button>
          </div>
        )}

        {/* Connected state */}
        {state === 'connected' && address && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Wallet Connected</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </p>
              </div>
            </div>
            
            <Button variant="outline" onClick={handleDisconnect} className="w-full">
              Disconnect Wallet
            </Button>
          </div>
        )}

        {/* Wrong network state */}
        {(state === 'wrong-network' || state === 'switching-network') && address && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-green-500/50 bg-green-500/10 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Wallet Connected</p>
                <p className="text-xs font-mono text-muted-foreground">
                  {address.slice(0, 10)}...{address.slice(-8)}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/50 bg-amber-500/10 p-4">
                <Network className="h-5 w-5 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium">Wrong Network</p>
                  <p className="text-xs text-muted-foreground">
                    Please switch to {andechain.name} to continue.
                  </p>
                </div>
              </div>
              <Button 
                onClick={handleSwitchNetwork} 
                className="w-full"
                disabled={state === 'switching-network'}
              >
                {state === 'switching-network' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Switching...
                  </>
                ) : (
                  <>
                    <Network className="mr-2 h-4 w-4" />
                    Switch to AndeChain
                  </>
                )}
              </Button>
            </div>
            
            <Button variant="outline" onClick={handleDisconnect} className="w-full">
              Disconnect Wallet
            </Button>
          </div>
        )}

        {/* Disconnected state */}
        {(state === 'disconnected' || state === 'connecting') && (
          <Button 
            onClick={handleConnect} 
            disabled={isLoading}
            className="w-full"
            size="lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </>
            )}
          </Button>
        )}

        <div className="space-y-2 rounded-lg bg-muted p-4 text-xs">
          <p className="font-medium">Supported Wallets</p>
          <ul className="space-y-1 text-muted-foreground">
            <li>• MetaMask (Browser Extension)</li>
            <li>• WalletConnect (Mobile & Desktop)</li>
            <li>• Coinbase Wallet</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
