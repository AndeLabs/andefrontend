'use client';

import dynamic from 'next/dynamic';
import { DollarSign, Wallet, TrendingUp, FileCode, ExternalLink, Copy, CheckCircle2, ArrowUpRight, ArrowDownRight, FileText, RefreshCw } from "lucide-react";
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatEther } from 'viem';

import { BalanceCard } from "@/components/dashboard/balance-card";
import { NetworkStatusCompact } from "@/components/dashboard/network-status-compact";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAndeBalance } from '@/hooks/use-ande-balance';
import { useUserTransactions } from '@/hooks/use-user-transactions';
import { andechainTestnet as andechain } from '@/lib/chains';
import { getDeployedContracts, PRECOMPILES } from '@/contracts/addresses';

const OverviewChart = dynamic(() => 
  import('@/components/dashboard/overview-chart').then(mod => mod.OverviewChart),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  }
);

export function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { balance: andeBalance, isLoading: isAndeLoading } = useAndeBalance();
  const { transactions, isLoading: isTxLoading, refetch: refetchTxs } = useUserTransactions(10);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const formattedAndeBalance = andeBalance 
    ? parseFloat(andeBalance.formatted).toFixed(2) 
    : '0.00';

  const andePrice = 2.30; // Precio simulado de ANDE en USD
  const totalValue = parseFloat(formattedAndeBalance) * andePrice;
  
  const andeBalanceDisplay = isConnected ? `${formattedAndeBalance} ANDE` : '0.00 ANDE';
  const totalBalanceDisplay = isConnected ? `$${totalValue.toFixed(2)}` : '$0.00';

  const portfolioData = [
    { 
      asset: 'ANDE', 
      balance: andeBalanceDisplay, 
      value: `$${(parseFloat(formattedAndeBalance) * andePrice).toFixed(2)}`,
      allocation: '100%'
    },
  ];

  const deployedContracts = getDeployedContracts();

  const copyToClipboard = async (text: string, contractName: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAddress(contractName);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleRefreshTransactions = async () => {
    setIsRefreshing(true);
    try {
      await refetchTxs();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* ANDE Balance Card */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="ANDE Balance"
          balance={andeBalanceDisplay}
          usdValue={totalBalanceDisplay}
          change="+2.5%"
          icon={<Wallet />}
          isLoading={isAndeLoading && isConnected}
        />
      </div>

      {/* Total Value Card */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="Total Value"
          balance={totalBalanceDisplay}
          usdValue={`${formattedAndeBalance} ANDE`}
          change="+1.8%"
          icon={<DollarSign />}
          isLoading={isAndeLoading && isConnected}
        />
      </div>

      {/* ANDE Price Card */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="ANDE Price"
          balance={`$${andePrice.toFixed(2)}`}
          usdValue="Native Currency"
          change="+0.5%"
          icon={<TrendingUp />}
          isLoading={false}
        />
      </div>

      {/* Network Status */}
      <div className="lg:col-span-1">
        <NetworkStatusCompact />
      </div>

      {/* Overview Chart */}
      <div className="lg:col-span-3">
        <OverviewChart />
      </div>

      {/* Portfolio Card */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>Asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.map((item) => (
                  <TableRow key={item.asset}>
                    <TableCell className="font-medium">{item.asset}</TableCell>
                    <TableCell className="text-right">{item.balance}</TableCell>
                    <TableCell className="text-right">{item.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Deployed Contracts */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Smart Contracts
                </CardTitle>
                <CardDescription>Deployed contracts on {andechain.name}</CardDescription>
              </div>
              <Badge variant="secondary">{deployedContracts.length} Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deployedContracts.map((contract) => (
                <div key={contract.name} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{contract.name}</p>
                      {contract.config?.verified && (
                        <Badge variant="secondary" className="text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      {truncateAddress(contract.address)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => copyToClipboard(contract.address, contract.name)}
                    >
                      {copiedAddress === contract.name ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      asChild
                    >
                      <a
                        href={`${andechain.blockExplorers?.default.url}/address/${contract.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
              
              {/* Precompile */}
              <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">ANDE Native (Precompile)</p>
                    <Badge variant="default" className="text-xs">Native</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {truncateAddress(PRECOMPILES.ANDE_NATIVE)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(PRECOMPILES.ANDE_NATIVE, 'ANDE_NATIVE')}
                  >
                    {copiedAddress === 'ANDE_NATIVE' ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    asChild
                  >
                    <a
                      href={`${andechain.blockExplorers?.default.url}/address/${PRECOMPILES.ANDE_NATIVE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest transactions on {andechain.name}</CardDescription>
              </div>
              {isConnected && transactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshTransactions}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center text-muted-foreground py-8">
                <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Connect your wallet to view activity</p>
              </div>
            ) : isTxLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No recent activity to display</p>
                <p className="text-xs mt-2">Your transactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const isOutgoing = tx.type === 'send';
                  const isFailed = tx.status === 'failed';
                  const timestamp = Number(tx.timestamp) * 1000;

                  return (
                    <div
                      key={tx.hash}
                      className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      {/* Icon */}
                      <div className={`
                        flex items-center justify-center h-10 w-10 rounded-full
                        ${isFailed ? 'bg-red-100' : isOutgoing ? 'bg-orange-100' : 'bg-green-100'}
                      `}>
                        {tx.type === 'contract' ? (
                          <FileCode className={`h-5 w-5 ${isFailed ? 'text-red-600' : 'text-blue-600'}`} />
                        ) : isOutgoing ? (
                          <ArrowUpRight className={`h-5 w-5 ${isFailed ? 'text-red-600' : 'text-orange-600'}`} />
                        ) : (
                          <ArrowDownRight className="h-5 w-5 text-green-600" />
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">
                            {tx.type === 'contract' ? 'Contract Interaction' : isOutgoing ? 'Send' : 'Receive'}
                          </span>
                          <Badge 
                            variant={isFailed ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {tx.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-xs text-muted-foreground font-mono">
                            {truncateAddress(tx.hash)}
                          </code>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(timestamp, { addSuffix: true })}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right">
                        <div className={`font-semibold ${isOutgoing ? 'text-orange-600' : 'text-green-600'}`}>
                          {isOutgoing ? '-' : '+'}{parseFloat(formatEther(tx.value)).toFixed(4)} ANDE
                        </div>
                        {tx.to && (
                          <div className="text-xs text-muted-foreground font-mono">
                            {truncateAddress(tx.to)}
                          </div>
                        )}
                      </div>

                      {/* Explorer Link */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        asChild
                      >
                        <a
                          href={`${andechain.blockExplorers?.default.url}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}