'use client';

import { useBlockNumber, useFeeData, useBlock } from 'wagmi';
import { formatGwei, formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { andechain } from "@/lib/chains";
import { useChainStats } from "@/hooks/use-chain-stats";
import { Activity, Zap, Layers, Clock, Database, HardDrive, Network as NetworkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function NetworkPage() {
  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({ 
    watch: true,
    chainId: andechain.id,
  });

  const { data: latestBlock, isLoading: isLatestBlockLoading } = useBlock({
    chainId: andechain.id,
    blockNumber: blockNumber,
  });

  const { data: feeData, isLoading: isFeeLoading } = useFeeData({
    chainId: andechain.id,
  });

  const { tps, avgBlockTime, totalTransactions, isLoading: isStatsLoading } = useChainStats();
  
  const gasPriceInGwei = feeData?.gasPrice ? formatGwei(feeData.gasPrice) : null;
  const baseFeeInGwei = latestBlock?.baseFeePerGas ? formatGwei(latestBlock.baseFeePerGas) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Status</h1>
        <p className="text-muted-foreground mt-2">
          Real-time metrics and statistics for {andechain.name}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isBlockLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {blockNumber?.toString() || '—'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Current block height
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Price</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isFeeLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {gasPriceInGwei ? parseFloat(gasPriceInGwei).toFixed(4) : 'N/A'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Gwei
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TPS</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{tps}</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Transactions per second
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Block Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isStatsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">{avgBlockTime}s</div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Average block time
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Chain Information</CardTitle>
            <CardDescription>Network configuration and details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <NetworkIcon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Network Name</span>
              </div>
              <Badge variant="outline">{andechain.name}</Badge>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chain ID</span>
              <span className="font-mono font-semibold">{andechain.id}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Native Currency</span>
              <span className="font-semibold">{andechain.nativeCurrency.symbol}</span>
            </div>

            <Separator />

            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">RPC Endpoint</span>
              <code className="text-xs bg-muted p-2 rounded font-mono break-all">
                {andechain.rpcUrls.default.http[0]}
              </code>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network Type</span>
              <Badge variant="secondary">{andechain.testnet ? 'Testnet' : 'Mainnet'}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Block Details</CardTitle>
            <CardDescription>Information about the most recent block</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLatestBlockLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : latestBlock ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Block Hash</span>
                  <code className="text-xs font-mono">
                    {latestBlock.hash?.slice(0, 10)}...{latestBlock.hash?.slice(-8)}
                  </code>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Timestamp</span>
                  <span className="text-sm">
                    {new Date(Number(latestBlock.timestamp) * 1000).toLocaleString()}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Transactions</span>
                  <span className="font-semibold">{latestBlock.transactions.length}</span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gas Used</span>
                  <span className="font-mono text-sm">
                    {latestBlock.gasUsed?.toString() || '0'}
                  </span>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Gas Limit</span>
                  <span className="font-mono text-sm">
                    {latestBlock.gasLimit?.toString() || '0'}
                  </span>
                </div>

                {baseFeeInGwei && (
                  <>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Base Fee</span>
                      <span className="font-semibold">
                        {parseFloat(baseFeeInGwei).toFixed(4)} Gwei
                      </span>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Miner/Validator</span>
                  <code className="text-xs font-mono">
                    {latestBlock.miner?.slice(0, 6)}...{latestBlock.miner?.slice(-4)}
                  </code>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No block data available
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Network Statistics</CardTitle>
          <CardDescription>Computed from the last 10 blocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Database className="h-4 w-4" />
                <span className="text-sm">Total Transactions</span>
              </div>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{totalTransactions}</div>
              )}
              <p className="text-xs text-muted-foreground">
                In analyzed blocks
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Activity className="h-4 w-4" />
                <span className="text-sm">Average TPS</span>
              </div>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{tps}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Transactions per second
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">Block Interval</span>
              </div>
              {isStatsLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{avgBlockTime}s</div>
              )}
              <p className="text-xs text-muted-foreground">
                Average time between blocks
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Network Health</CardTitle>
          <CardDescription>Current operational status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">RPC Connection</p>
              <p className="text-xs text-muted-foreground">
                Connected to {andechain.rpcUrls.default.http[0]}
              </p>
            </div>
            <Badge className="gap-2 bg-green-500 hover:bg-green-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-100"></span>
              </span>
              Operational
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
