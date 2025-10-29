'use client';

import { useState, useEffect } from 'react';
import { useAndeBalance } from '@/hooks/use-ande-balance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAccount } from 'wagmi';
import { parseEther, formatEther, isAddress } from 'viem';
import { Droplet, CheckCircle2, AlertCircle, Loader2, Wallet, Copy, ExternalLink, History, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { andechainTestnet as andechain } from '@/lib/chains';
import { addAndeChainToWallet } from '@/lib/web3-provider';
import { Separator } from '@/components/ui/separator';
import { useChainId, useSwitchChain } from 'wagmi';

interface FaucetRequest {
  address: string;
  amount: string;
  timestamp: number;
  txHash?: string;
}

interface FaucetInfo {
  account: string;
  network: string;
  payout: string;
  symbol: string;
}

export default function FaucetPage() {
  const { address, isConnected } = useAccount();
  const { balance, refetch: refetchBalance } = useAndeBalance();
  const { toast } = useToast();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [loading, setLoading] = useState(false);
  const [customAddress, setCustomAddress] = useState('');
  const [recentRequests, setRecentRequests] = useState<FaucetRequest[]>([]);
  const [faucetInfo, setFaucetInfo] = useState<FaucetInfo | null>(null);

  const targetAddress = customAddress || address;
  const isValidAddress = targetAddress ? isAddress(targetAddress) : false;

  // Helper to get the correct token symbol (convert ETH to ANDE for AndeChain)
  const getTokenSymbol = (symbol?: string) => {
    return symbol === 'ETH' ? 'ANDE' : symbol || 'ANDE';
  };

  // Helper to format token amount
  const formatTokenAmount = (amount: string) => {
    return (parseFloat(amount) / 1e18).toFixed(6);
  };

  // Helper to switch to AndeChain network
  const handleSwitchNetwork = async () => {
    try {
      if (switchChain) {
        await switchChain({ chainId: andechain.id });
      } else {
        // Fallback to adding network manually
        await addAndeChainToWallet();
      }
      toast({
        title: '✅ Network Added',
        description: 'AndeChain network added to your wallet',
      });
    } catch (error) {
      toast({
        title: '❌ Network Error',
        description: 'Failed to switch to AndeChain network',
        variant: 'destructive',
      });
    }
  };

  // Check if user is on correct network
  const isCorrectNetwork = chainId === andechain.id;

  // Fetch faucet info on mount
  useEffect(() => {
    const fetchFaucetInfo = async () => {
      try {
        const faucetUrl = process.env.NEXT_PUBLIC_FAUCET_URL || 'http://localhost:3001';
        const response = await fetch(`${faucetUrl}/api/info`);
        if (response.ok) {
          const info = await response.json();
          setFaucetInfo(info);
        }
      } catch (error) {
        console.error('Failed to fetch faucet info:', error);
      }
    };

    fetchFaucetInfo();
  }, []);

  const requestTokens = async () => {
    if (!targetAddress || !isValidAddress) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid Ethereum address',
        variant: 'destructive',
      });
      return;
    }



    setLoading(true);
    try {
      const faucetUrl = process.env.NEXT_PUBLIC_FAUCET_URL || 'http://localhost:3001';
      const explorerUrl = process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://localhost:4000';

      const response = await fetch(`${faucetUrl}/api/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: targetAddress,
        }),
      });

      const data = await response.json();

      if (response.ok && !data.msg) {
        const newRequest: FaucetRequest = {
          address: targetAddress,
          amount: faucetInfo?.payout || '0',
          timestamp: Date.now(),
          txHash: data.txHash,
        };

        setRecentRequests((prev) => [newRequest, ...prev].slice(0, 5));

        toast({
          title: '✅ Transaction Sent!',
          description: `${formatTokenAmount(faucetInfo?.payout || '0')} ${getTokenSymbol(faucetInfo?.symbol)} sent to ${targetAddress.slice(0, 10)}...${targetAddress.slice(-8)}${data.txHash ? `. TX: ${data.txHash.slice(0, 10)}...` : ''}`,
        });

        setTimeout(() => {
          refetchBalance();
        }, 2000);
        setCustomAddress('');
      } else {
        throw new Error(data.msg || 'Failed to request tokens');
      }
    } catch (error) {
      console.error('Faucet error:', error);
      toast({
        title: '❌ Error',
        description: error instanceof Error ? error.message : 'Failed to request tokens from faucet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

   const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: '✅ Copied!',
      description: `${label} copied to clipboard`,
    });
  };



  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Droplet className="h-8 w-8 text-blue-500" />
          AndeChain Faucet
        </h1>
        <p className="text-muted-foreground mt-2">
          Get free test ANDE tokens for development on {andechain.name}
        </p>
      </div>

      {/* Network Warning */}
      {isConnected && !isCorrectNetwork && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wrong Network</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Please switch to {andechain.name} to use the faucet.</span>
            <Button variant="outline" size="sm" onClick={handleSwitchNetwork}>
              Switch Network
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Request Tokens</CardTitle>
            <CardDescription>
              Receive test ANDE tokens instantly for your wallet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isConnected && address && (
              <Alert>
                <Wallet className="h-4 w-4" />
                <AlertTitle>Connected Wallet</AlertTitle>
                <AlertDescription className="mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {address}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(address, 'Address')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  {balance && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Balance:</span>
                      <span className="font-semibold">
                        {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                      </span>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!isConnected && (
              <div className="space-y-2">
                <Label htmlFor="address">Recipient Address</Label>
                <Input
                  id="address"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  placeholder="0x..."
                  className={!isValidAddress && customAddress ? 'border-destructive' : ''}
                />
                {customAddress && !isValidAddress && (
                  <p className="text-xs text-destructive">Invalid Ethereum address</p>
                )}
              </div>
            )}

            <Alert>
              <Droplet className="h-4 w-4" />
              <AlertTitle>Fixed Amount</AlertTitle>
              <AlertDescription>
                Each request will send <strong>{faucetInfo?.payout ? formatTokenAmount(faucetInfo.payout) : '0'} {getTokenSymbol(faucetInfo?.symbol)}</strong> to your wallet
              </AlertDescription>
            </Alert>

            <Button
              onClick={requestTokens}
              disabled={loading || !isValidAddress || (isConnected && !isCorrectNetwork)}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Requesting Tokens...
                </>
              ) : (
                <>
                  <Droplet className="mr-2 h-5 w-5" />
                  Request {faucetInfo?.payout ? formatTokenAmount(faucetInfo.payout) : '0'} {getTokenSymbol(faucetInfo?.symbol)} Tokens
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Faucet Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount per Request</span>
                  <span className="font-semibold">{faucetInfo?.payout ? formatTokenAmount(faucetInfo.payout) : '0'} {getTokenSymbol(faucetInfo?.symbol)}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Network</span>
                  <Badge variant="outline">{andechain.name}</Badge>
                </div>
                <Separator />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Chain ID</span>
                  <span className="font-mono font-semibold">{andechain.id}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Important Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Tokens are delivered instantly
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Local development network only
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  ANDE is the native currency (like ETH on Ethereum)
                </p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground">
                  Balance shows automatically (native currency)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {recentRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Recent Requests
            </CardTitle>
            <CardDescription>
              Your recent faucet transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentRequests.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono">
                        {req.address.slice(0, 10)}...{req.address.slice(-8)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyToClipboard(req.address, 'Address')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(req.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary">+{formatTokenAmount(req.amount)} {getTokenSymbol(faucetInfo?.symbol)}</Badge>
                    {req.txHash && (
                      <div className="flex gap-1 mt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => copyToClipboard(req.txHash!, 'Transaction hash')}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          <span className="text-xs">Copy</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          asChild
                        >
                          <a
                            href={`${process.env.NEXT_PUBLIC_EXPLORER_URL || 'http://localhost:4000'}/tx/${req.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            <span className="text-xs">View</span>
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
