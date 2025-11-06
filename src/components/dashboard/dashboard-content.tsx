'use client';

import dynamic from 'next/dynamic';
import { DollarSign, Wallet, TrendingUp, FileCode, ExternalLink, Copy, CheckCircle2, ArrowUpRight, ArrowDownRight, FileText, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { useAccount, useChainId } from 'wagmi';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { formatEther } from 'viem';

import { BalanceCard } from "@/components/dashboard/balance-card";
import { NetworkStatusCompact } from "@/components/dashboard/network-status-compact";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, Alert, AlertDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// Nuevos hooks mejorados para AndeChain
import { useBlockchainData, useNativeBalance, useTokenBalance, useGasPrice, useRecentTransactions } from '@/hooks/use-blockchain';
import { isAndeChain } from '@/lib/chains';
import { getDeployedContracts, PRECOMPILES } from '@/contracts/addresses';
import { andechainTestnet as andechain } from '@/lib/chains';

const OverviewChart = dynamic(() => 
  import('@/components/dashboard/overview-chart').then(mod => mod.OverviewChart),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  }
);

export function DashboardContent() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const isValidChain = isAndeChain(chainId);
  
  // 🔥 Hooks mejorados con datos reales de AndeChain
  const blockchainData = useBlockchainData(address);
  const { data: nativeBalance } = useNativeBalance(address, { watch: true });
  const { data: tokenBalance } = useTokenBalance(address, { watch: true });
  const { data: gasPrice } = useGasPrice();
  const { data: recentTransactions } = useRecentTransactions(10);

  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Formatear balances para display
  const formattedNativeBalance = nativeBalance 
    ? parseFloat(nativeBalance.formatted).toFixed(4)
    : '0.0000';

  const formattedTokenBalance = tokenBalance
    ? parseFloat(tokenBalance.formatted).toFixed(4)
    : '0.0000';

  // Precio ANDE (puede venir de API en futuro)
  const andePriceUSD = 0.15; // Placeholder - integrar Coingecko después
  const totalValueUSD = (parseFloat(formattedTokenBalance) * andePriceUSD);

  const andeBalanceDisplay = isConnected 
    ? `${formattedTokenBalance} ANDE` 
    : '0.0000 ANDE';
  const totalBalanceDisplay = isConnected 
    ? `$${totalValueUSD.toFixed(4)}` 
    : '$0.0000';

  const portfolioData = [
    { 
      asset: 'ANDE', 
      balance: andeBalanceDisplay, 
      value: `$${totalValueUSD.toFixed(4)}`,
      allocation: '100%'
    },
  ];

  const deployedContracts = getDeployedContracts();

  // Helper functions
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
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleRefreshTransactions = async () => {
    setIsRefreshing(true);
    try {
      await blockchainData.refresh?.();
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      console.error('Error refreshing transactions:', error);
      setIsRefreshing(false);
    }
  };

  // Formatear gas price para display
  const gasPriceGwei = gasPrice 
    ? parseFloat(formatEther(gasPrice)).toFixed(6)
    : '0.000000';

  // Verificar si estamos en la chain correcta
  const isCorrectNetwork = isConnected && isValidChain;
  const networkStatusText = isCorrectNetwork ? 'Connected' : 'Wrong Network';
  const networkStatusColor = isCorrectNetwork ? 'green' : 'red';

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Network Status Warning si no estamos en AndeChain */}
      {isConnected && !isValidChain && (
        <div className="lg:col-span-4">
          <Alert className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Wrong Network Detected</strong>
              <p className="mt-1">
                Please switch to <strong>AndeChain</strong> (Chain ID: {andechain.id}) to use this dashboard.
                Your wallet is currently on Chain ID: {chainId}.
              </p>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* ANDE Balance Card - Datos Reales ✅ */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="ANDE Balance"
          balance={andeBalanceDisplay}
          usdValue={totalBalanceDisplay}
          change="+2.5%"
          icon={<Wallet />}
          isLoading={blockchainData.isLoading}
        />
      </div>

      {/* Total Value Card */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="Total Value"
          balance={totalBalanceDisplay}
          usdValue={`${formattedTokenBalance} ANDE`}
          change="+1.8%"
          icon={<DollarSign />}
          isLoading={blockchainData.isLoading}
        />
      </div>

      {/* Gas Price Card - Datos Reales ✅ */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="Gas Price"
          balance={`${gasPriceGwei} Gwei`}
          usdValue="Current Gas Cost"
          change={
            blockchainData.metrics?.blockNumber 
              ? `Block #${blockchainData.metrics.blockNumber.toString()}`
              : 'Fetching...'
          }
          icon={<TrendingUp />}
          isLoading={blockchainData.isLoading}
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
            <CardTitle className="text-base">Portfolio</CardTitle>
            <CardDescription className="text-xs">Asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <Table className="text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Asset</TableHead>
                  <TableHead className="text-right text-xs">Balance</TableHead>
                  <TableHead className="text-right text-xs">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.map((item) => (
                  <TableRow key={item.asset}>
                    <TableCell className="font-medium text-sm">{item.asset}</TableCell>
                    <TableCell className="text-right text-sm">{item.balance}</TableCell>
                    <TableCell className="text-right text-sm">{item.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Smart Contracts - AndeChain Deployed ✅ */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileCode className="h-5 w-5" />
                  Smart Contracts
                </CardTitle>
                <CardDescription className="text-xs mt-1">
                  Deployed on {andechain.name}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs">
                {deployedContracts.length} Active
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {deployedContracts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No contracts deployed yet
                </p>
              ) : (
                deployedContracts.map((contract) => (
                  <div
                    key={contract.name}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50 transition-colors text-sm"
                  >
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
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {truncateAddress(contract.address)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyToClipboard(contract.address, contract.name)}
                      >
                        {copiedAddress === contract.name ? (
                          <CheckCircle2 className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        asChild
                      >
                        <a
                          href={`${andechain.blockExplorers?.default.url}/address/${contract.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                ))
              )}

              {/* Precompile ANDE - Nativo ✅ */}
              <div className="flex items-center justify-between p-2 border rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors text-sm">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">ANDE Native (Precompile)</p>
                    <Badge variant="default" className="text-xs">Native</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    {truncateAddress(PRECOMPILES.ANDE_NATIVE)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => copyToClipboard(PRECOMPILES.ANDE_NATIVE, 'ANDE_NATIVE')}
                  >
                    {copiedAddress === 'ANDE_NATIVE' ? (
                      <CheckCircle2 className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    asChild
                  >
                    <a
                      href={`${andechain.blockExplorers?.default.url}/address/${PRECOMPILES.ANDE_NATIVE}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Transacciones Reales ✅ */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription className="text-xs mt-1">
                  Latest transactions on {andechain.name}
                </CardDescription>
              </div>
              {isConnected && recentTransactions && recentTransactions.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefreshTransactions}
                  disabled={isRefreshing}
                  className="h-8 w-8 p-0"
                >
                  {isRefreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center text-muted-foreground py-8">
                <Wallet className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Connect your wallet to view activity</p>
              </div>
            ) : blockchainData.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !recentTransactions || recentTransactions.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
                <p className="text-xs mt-2">Your transactions will appear here</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {recentTransactions.map((tx) => (
                  <TransactionRow 
                    key={tx.hash} 
                    tx={tx} 
                    andechain={andechain}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Component helper para fila de transacción
function TransactionRow({ 
  tx, 
  andechain 
}: { 
  tx: any; 
  andechain: any; 
}) {
  const isOutgoing = tx.from?.toLowerCase() !== tx.to?.toLowerCase();
  const isFailed = tx.status === 'failed';
  const isPending = tx.status === 'pending';
  const isSuccess = tx.status === 'success';

  const getStatusIcon = () => {
    if (isPending) {
      return <Loader2 className="w-3.5 h-3.5 text-yellow-600 animate-spin" />;
    }
    if (isSuccess) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />;
    }
    if (isFailed) {
      return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
    }
    return null;
  };

  const shortHash = `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`;
  const explorerUrl = `${andechain.blockExplorers?.default.url}/tx/${tx.hash}`;

  const txValue = parseFloat(formatEther(tx.value || BigInt(0))).toFixed(4);
  const txFee = tx.fee ? parseFloat(tx.fee).toFixed(6) : null;

  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors text-sm">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getStatusIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-primary hover:underline"
            >
              {shortHash}
            </a>
            {tx.timestamp && (
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(tx.timestamp * 1000), {
                  addSuffix: true,
                })}
              </span>
            )}
          </div>
          
          {(tx.to && isOutgoing) && (
            <div className="text-xs text-muted-foreground font-mono">
              To: {truncateAddress(tx.to)}
            </div>
          )}
        </div>
      </div>

      <div className="text-right">
        <div
          className={`text-xs font-semibold ${
            isOutgoing ? 'text-red-600' : 'text-green-600'
          }`}
        >
          {isOutgoing ? '-' : '+'}{txValue} ANDE
        </div>
        
        {txFee && (
          <div className="text-xs text-muted-foreground font-mono">
            Fee: {txFee}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 ml-2"
        asChild
      >
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <ExternalLink className="h-3 w-3" />
        </a>
      </Button>
    </div>
  );
}

// Helper function para truncar direcciones
function truncateAddress(addr: string) {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}