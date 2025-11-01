'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Network, Plus, CheckCircle2, AlertCircle, Loader2, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

interface NetworkConfig {
  chainId: number;
  chainName: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls?: string[];
}

const ANDECHAIN_NETWORKS: Record<string, NetworkConfig> = {
  testnet: {
    chainId: 6174,
    chainName: 'AndeChain Mocha',
    nativeCurrency: {
      name: 'ANDE',
      symbol: 'ANDE',
      decimals: 18,
    },
    rpcUrls: ['http://localhost:8545'],
    blockExplorerUrls: ['http://localhost:4000'],
  },
  local: {
    chainId: 1234,
    chainName: 'AndeChain Local',
    nativeCurrency: {
      name: 'ANDE',
      symbol: 'ANDE',
      decimals: 18,
    },
    rpcUrls: ['http://localhost:8545'],
    blockExplorerUrls: ['http://localhost:4000'],
  },
};

interface AddNetworkButtonProps {
  network: 'testnet' | 'local';
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

/**
 * AddNetworkButton Component
 * 
 * Adds AndeChain networks to MetaMask with one click
 * Handles all error cases and provides user feedback
 * 
 * Usage:
 * ```tsx
 * <AddNetworkButton network="testnet" />
 * <AddNetworkButton network="local" variant="outline" size="sm" />
 * ```
 */
export function AddNetworkButton({
  network,
  variant = 'default',
  size = 'default',
  showIcon = true,
  className,
}: AddNetworkButtonProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const { toast } = useToast();

  const config = ANDECHAIN_NETWORKS[network];

  const addNetwork = async () => {
    if (!window.ethereum) {
      toast({
        title: '❌ MetaMask Not Found',
        description: 'Please install MetaMask browser extension',
        variant: 'destructive',
      });
      return;
    }

    setIsAdding(true);

    try {
      // Convert chainId to hex
      const chainIdHex = `0x${config.chainId.toString(16)}`;

      // Try to switch to the network first (if it exists)
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });

        setIsAdded(true);
        toast({
          title: '✅ Network Selected',
          description: `Switched to ${config.chainName}`,
        });
        return;
      } catch (switchError: any) {
        // If network doesn't exist (error code 4902), add it
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: chainIdHex,
              chainName: config.chainName,
              nativeCurrency: config.nativeCurrency,
              rpcUrls: config.rpcUrls,
              blockExplorerUrls: config.blockExplorerUrls,
            }],
          });

          setIsAdded(true);
          toast({
            title: '✅ Network Added',
            description: `${config.chainName} has been added to MetaMask`,
          });
        } else {
          throw switchError;
        }
      }
    } catch (error: any) {
      console.error('Failed to add network:', error);

      let errorMessage = 'Failed to add network to MetaMask';
      
      if (error.code === 4001) {
        errorMessage = 'You rejected the request';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: '❌ Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      onClick={addNetwork}
      disabled={isAdding || isAdded}
      variant={variant}
      size={size}
      className={className}
    >
      {isAdding ? (
        <>
          <Loader2 className={`${showIcon ? 'mr-2' : ''} h-4 w-4 animate-spin`} />
          {showIcon && 'Adding...'}
        </>
      ) : isAdded ? (
        <>
          <CheckCircle2 className={`${showIcon ? 'mr-2' : ''} h-4 w-4`} />
          {showIcon && 'Added'}
        </>
      ) : (
        <>
          <Plus className={`${showIcon ? 'mr-2' : ''} h-4 w-4`} />
          {showIcon && `Add ${config.chainName}`}
        </>
      )}
    </Button>
  );
}

/**
 * NetworkSetupCard Component
 * 
 * Full card with both networks and instructions
 */
export function NetworkSetupCard() {
  const { toast } = useToast();

  const checkRPC = async (rpcUrl: string) => {
    try {
      const response = await fetch(rpcUrl, {
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
      
      return { success: true, chainId };
    } catch (error) {
      return { success: false, chainId: null };
    }
  };

  const handleTestRPC = async () => {
    toast({
      title: '🔍 Testing RPC Connection...',
      description: 'Checking if blockchain node is running',
    });

    const result = await checkRPC('http://localhost:8545');

    if (result.success) {
      toast({
        title: '✅ RPC Connected',
        description: `Blockchain is running on chainId: ${result.chainId}`,
      });
    } else {
      toast({
        title: '❌ RPC Not Available',
        description: 'Make sure your blockchain node is running on http://localhost:8545',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          MetaMask Network Setup
        </CardTitle>
        <CardDescription>
          Add AndeChain networks to MetaMask with one click
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Current Configuration</AlertTitle>
          <AlertDescription>
            Your blockchain is running on <strong>chainId 6174</strong> (AndeChain Mocha).
            Make sure to add and connect to the correct network.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-primary/5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">AndeChain Mocha</h4>
                <Badge variant="default">Recommended</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Production testnet with EVOLVE sequencer + Celestia DA
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Chain ID: <strong>6174</strong></span>
                <span>RPC: <strong>localhost:8545</strong></span>
              </div>
            </div>
            <AddNetworkButton network="testnet" />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">AndeChain Local</h4>
                <Badge variant="outline">Development</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Standalone ev-reth for local development
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>Chain ID: <strong>1234</strong></span>
                <span>RPC: <strong>localhost:8545</strong></span>
              </div>
            </div>
            <AddNetworkButton network="local" variant="outline" />
          </div>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              Click the button to add the network to MetaMask
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              MetaMask will prompt you to approve the network addition
            </p>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-muted-foreground">
              Once added, MetaMask will automatically switch to the new network
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleTestRPC} variant="outline" size="sm" className="w-full">
            <Network className="mr-2 h-4 w-4" />
            Test RPC Connection
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Troubleshooting</AlertTitle>
          <AlertDescription className="space-y-2 text-xs">
            <p>
              <strong>MetaMask shows "Chain ID mismatch":</strong><br />
              Your RPC is responding with a different chainId. Make sure you're adding
              the network that matches your running blockchain (chainId 6174).
            </p>
            <p>
              <strong>RPC not available:</strong><br />
              Make sure your blockchain node is running: <code className="bg-muted px-1">make full-start</code>
            </p>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

/**
 * Compact version for navbar or header
 */
export function AddNetworkCompact() {
  return (
    <div className="flex items-center gap-2">
      <AddNetworkButton 
        network="testnet" 
        size="sm" 
        showIcon={false}
      />
    </div>
  );
}

