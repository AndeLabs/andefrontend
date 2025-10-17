'use client';

import { useState, useRef, useEffect } from 'react';
import { Wallet, Zap, Shield, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { useAccount } from 'wagmi';

export function ConnectWalletPrompt() {
  const { connect, isLoading, state } = useWalletConnection();
  const { isConnected, isConnecting, status, address } = useAccount();
  
  // Guard para prevenir clicks múltiples
  const [isClicking, setIsClicking] = useState(false);
  const clickTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Auto-detectar cuando se conecta exitosamente y forzar re-render
  useEffect(() => {
    if (isConnected && address) {
      console.log('✅ Connection detected in ConnectWalletPrompt!', { address, status });
      console.log('🔄 Connection successful - page should update now');
      
      // Forzar un pequeño delay para asegurar que el estado se propagó
      setTimeout(() => {
        console.log('🔄 Forcing page update...');
        window.dispatchEvent(new Event('wallet-connected'));
      }, 100);
    }
  }, [isConnected, address, status]);

  const handleConnect = async () => {
    // Prevenir clicks múltiples
    if (isClicking || isLoading || state === 'connecting') {
      console.log('🚫 Click ignored - already processing');
      return;
    }
    
    console.log('👆 Connect button clicked');
    setIsClicking(true);
    
    // Clear timeout previo
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }
    
    try {
      await connect();
    } catch (error) {
      console.error('Connection error:', error);
    } finally {
      // Resetear después de 3 segundos
      clickTimeoutRef.current = setTimeout(() => {
        console.log('🔓 Button ready for new click');
        setIsClicking(false);
      }, 3000);
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
      <Card className="w-full max-w-md border-2">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Wallet className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome to AndeChain</CardTitle>
            <CardDescription className="mt-2 text-base">
              Connect your wallet to access the decentralized ecosystem
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Connect Button */}
          <Button 
            onClick={handleConnect}
            disabled={isClicking || isLoading || state === 'connecting'}
            size="lg"
            className="w-full h-12 text-base font-semibold"
          >
            {isClicking || isLoading || state === 'connecting' ? (
              <>
                <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-5 w-5" />
                Connect Wallet
              </>
            )}
          </Button>

          {/* Features */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <Shield className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Secure Connection</p>
                <p className="text-xs text-muted-foreground">Your keys never leave your device</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Instant Access</p>
                <p className="text-xs text-muted-foreground">Start using AndeChain immediately</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-sm">
              <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                <Lock className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Full Control</p>
                <p className="text-xs text-muted-foreground">You own and control your assets</p>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              By connecting, you agree to our{' '}
              <a href="#" className="underline hover:text-foreground">Terms of Service</a>
              {' '}and{' '}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>
            </p>
          </div>

          {/* MetaMask Note */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Don't have MetaMask?{' '}
              <a 
                href="https://metamask.io/download/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary underline hover:text-primary/80"
              >
                Install it here
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Additional Info */}
      <div className="mt-8 text-center max-w-md">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">New to Web3?</strong> MetaMask is a secure wallet 
          that lets you interact with blockchain applications. It's free, easy to use, and keeps 
          you in control of your digital assets.
        </p>
      </div>
    </div>
  );
}