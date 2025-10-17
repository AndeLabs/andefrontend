'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAccount, usePublicClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Droplet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function Faucet() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState('10');
  const [loading, setLoading] = useState(false);
  const [customAddress, setCustomAddress] = useState('');

  const requestTokens = async () => {
    const targetAddress = customAddress || address;
    
    if (!targetAddress) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet or enter an address',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success!',
          description: `${amount} ANDE sent to ${targetAddress.slice(0, 10)}...`,
        });
        setCustomAddress('');
      } else {
        throw new Error(data.error || 'Failed to request tokens');
      }
    } catch (error) {
      console.error('Faucet error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to request tokens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5 text-blue-500" />
          AndeChain Faucet
        </CardTitle>
        <CardDescription>
          Request test ANDE tokens for your local development
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (ANDE)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            min="1"
            max="100"
          />
          <p className="text-xs text-muted-foreground">
            Maximum 100 ANDE per request
          </p>
        </div>

        {!isConnected && (
          <div className="space-y-2">
            <Label htmlFor="address">Recipient Address (Optional)</Label>
            <Input
              id="address"
              value={customAddress}
              onChange={(e) => setCustomAddress(e.target.value)}
              placeholder="0x..."
            />
          </div>
        )}

        {isConnected && address && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-medium">Connected Wallet</p>
            <p className="text-xs text-muted-foreground font-mono">{address}</p>
          </div>
        )}

        <Button
          onClick={requestTokens}
          disabled={loading || (!isConnected && !customAddress)}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <Droplet className="mr-2 h-4 w-4" />
              Request {amount} ANDE
            </>
          )}
        </Button>

        <div className="pt-4 border-t space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
            <div>
              <p className="font-medium">Local Development Only</p>
              <p className="text-xs text-muted-foreground">
                This faucet only works with your local AndeChain instance
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
            <div>
              <p className="font-medium">Test Tokens</p>
              <p className="text-xs text-muted-foreground">
                These tokens have no real value and are only for testing
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
