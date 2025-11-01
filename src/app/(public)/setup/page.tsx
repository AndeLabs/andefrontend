'use client';

import { useState, useEffect } from 'react';
import { NetworkSetupCard } from '@/components/add-network-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Network, 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  ArrowRight,
  Wallet,
  Zap,
  Shield,
  Blocks
} from 'lucide-react';
import Link from 'next/link';

export default function SetupPage() {
  const [hasMetaMask, setHasMetaMask] = useState(false);
  const [rpcStatus, setRpcStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [detectedChainId, setDetectedChainId] = useState<number | null>(null);

  useEffect(() => {
    // Check if MetaMask is installed
    setHasMetaMask(typeof window !== 'undefined' && !!window.ethereum);

    // Check RPC status
    checkRPC();
  }, []);

  const checkRPC = async () => {
    try {
      const response = await fetch('http://localhost:8545', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });

      const data = await response.json();
      const chainId = parseInt(data.result, 16);
      
      setDetectedChainId(chainId);
      setRpcStatus('online');
    } catch (error) {
      setRpcStatus('offline');
    }
  };

  return (
    <div className="container mx-auto py-12 px-4 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Network className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome to AndeChain
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get started by setting up your wallet and connecting to the AndeChain network
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* MetaMask Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                MetaMask
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hasMetaMask ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-semibold">Installed</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Not Found</span>
                  </div>
                  <Button asChild className="w-full">
                    <a
                      href="https://metamask.io/download/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Install MetaMask
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* RPC Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Blocks className="h-5 w-5" />
                Blockchain Node
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rpcStatus === 'checking' ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <div className="h-5 w-5 animate-pulse">⏳</div>
                  <span className="font-semibold">Checking...</span>
                </div>
              ) : rpcStatus === 'online' ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="font-semibold">Online</span>
                  </div>
                  {detectedChainId && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Chain ID:</span>
                      <Badge variant={detectedChainId === 6174 ? 'default' : 'secondary'}>
                        {detectedChainId}
                      </Badge>
                      {detectedChainId === 6174 && (
                        <span className="text-xs text-green-600">(Testnet)</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-semibold">Offline</span>
                  </div>
                  <Alert variant="destructive" className="text-xs">
                    <AlertDescription>
                      Start your blockchain node: <code className="bg-muted px-1">make full-start</code>
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Setup Instructions */}
        {hasMetaMask && rpcStatus === 'online' && (
          <>
            <NetworkSetupCard />

            {/* Features */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">High Performance</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  EVOLVE sequencer with parallel execution and MEV protection
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">Data Availability</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Powered by Celestia Mocha-4 testnet for secure data storage
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Network className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-base">EVM Compatible</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Full Ethereum compatibility with enhanced features
                </CardContent>
              </Card>
            </div>

            {/* Next Steps */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Ready to Go!
                </CardTitle>
                <CardDescription>
                  Your setup is complete. Start exploring AndeChain.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Link href="/dashboard">
                    <Button className="w-full" size="lg">
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/faucet">
                    <Button variant="outline" className="w-full">
                      Get Test ANDE Tokens
                    </Button>
                  </Link>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>First Time?</AlertTitle>
                  <AlertDescription className="text-sm space-y-2 mt-2">
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Add AndeChain Mocha network to MetaMask (button above)</li>
                      <li>Connect your wallet on the dashboard</li>
                      <li>Get free test tokens from the faucet</li>
                      <li>Start testing staking, governance, and more!</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </>
        )}

        {/* Troubleshooting */}
        {(!hasMetaMask || rpcStatus === 'offline') && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Setup Required
              </CardTitle>
              <CardDescription>
                Complete the following steps to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {!hasMetaMask && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-destructive/5">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">Install MetaMask</p>
                      <p className="text-sm text-muted-foreground">
                        You need MetaMask browser extension to connect to AndeChain
                      </p>
                      <Button asChild size="sm" className="mt-2">
                        <a
                          href="https://metamask.io/download/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download MetaMask
                          <ArrowRight className="ml-2 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {rpcStatus === 'offline' && (
                  <div className="flex items-start gap-3 p-3 border rounded-lg bg-destructive/5">
                    <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">Start Blockchain Node</p>
                      <p className="text-sm text-muted-foreground">
                        Your AndeChain node is not running
                      </p>
                      <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                        cd andechain && make full-start
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Button
                onClick={() => {
                  setHasMetaMask(!!window.ethereum);
                  checkRPC();
                }}
                variant="outline"
                className="w-full"
              >
                Recheck Status
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}