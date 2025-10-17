'use client';

import { useState } from 'react';
import { formatGwei } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { andechain } from "@/lib/chains";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { BlockActivityChart } from "@/components/network/block-activity-chart";
import { NetworkHealthIndicator } from "@/components/network/network-health-indicator";
import { RecentBlocksTable } from "@/components/network/recent-blocks-table";
import { 
  Activity, 
  Zap, 
  Layers, 
  Clock, 
  Database, 
  TrendingUp,
  Network as NetworkIcon,
  Gauge,
  Cpu,
  BarChart3,
} from "lucide-react";

export default function NetworkPage() {
  const [chartMetric, setChartMetric] = useState<'transactions' | 'gasUsed' | 'gasUtilization'>('transactions');
  
  const {
    blockHistory,
    metrics,
    health,
    latestBlock,
    isLoading,
    gasPrice,
    maxFeePerGas,
    maxPriorityFeePerGas,
  } = useNetworkStatus();
  
  const gasPriceInGwei = gasPrice ? formatGwei(gasPrice) : null;
  const maxFeeInGwei = maxFeePerGas ? formatGwei(maxFeePerGas) : null;
  const priorityFeeInGwei = maxPriorityFeePerGas ? formatGwei(maxPriorityFeePerGas) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Network Status</h1>
        <p className="text-muted-foreground mt-2">
          Real-time metrics and statistics for {andechain.name}
        </p>
      </div>

      {/* Network Health */}
      <NetworkHealthIndicator health={health} />

      {/* Key Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Block</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold tabular-nums">
                  {latestBlock?.number.toString() || '—'}
                </div>
                {latestBlock && (
                  <p className="text-xs text-muted-foreground">
                    {latestBlock.transactions} transaction{latestBlock.transactions !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Price</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {gasPriceInGwei ? parseFloat(gasPriceInGwei).toFixed(4) : 'N/A'}
                </div>
                <p className="text-xs text-muted-foreground">Gwei</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network TPS</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.tps.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Transactions per second
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Block Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.avgBlockTime.toFixed(2)}s</div>
                <p className="text-xs text-muted-foreground">
                  Average block time
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gas Utilization</CardTitle>
            <Gauge className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-2">
                <div className="text-2xl font-bold">{metrics.gasUtilization.toFixed(1)}%</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(metrics.gasUtilization, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Network capacity usage
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Gas Used</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {(Number(metrics.avgGasUsed) / 1_000_000).toFixed(2)}M
                </div>
                <p className="text-xs text-muted-foreground">
                  Per block average
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{metrics.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  In last {blockHistory.length} blocks
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Network Activity</CardTitle>
              <CardDescription>Real-time blockchain metrics visualization</CardDescription>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setChartMetric('transactions')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartMetric === 'transactions'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Transactions
              </button>
              <button
                onClick={() => setChartMetric('gasUsed')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartMetric === 'gasUsed'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Gas Used
              </button>
              <button
                onClick={() => setChartMetric('gasUtilization')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  chartMetric === 'gasUtilization'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                Utilization
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <BlockActivityChart blocks={blockHistory} metric={chartMetric} />
          )}
        </CardContent>
      </Card>

      {/* Recent Blocks */}
      <RecentBlocksTable blocks={blockHistory} isLoading={isLoading} />

      {/* Chain Information & Latest Block Details */}
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

            {andechain.blockExplorers?.default?.url && (
              <>
                <Separator />
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-muted-foreground">Block Explorer</span>
                  <a
                    href={andechain.blockExplorers.default.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline font-mono break-all"
                  >
                    {andechain.blockExplorers.default.url}
                  </a>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gas Price Details</CardTitle>
            <CardDescription>Current gas pricing information (EIP-1559)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current Gas Price</span>
              <span className="font-mono font-semibold">
                {gasPriceInGwei ? `${parseFloat(gasPriceInGwei).toFixed(4)} Gwei` : 'N/A'}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Max Fee Per Gas</span>
              <span className="font-mono font-semibold">
                {maxFeeInGwei ? `${parseFloat(maxFeeInGwei).toFixed(4)} Gwei` : 'N/A'}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Priority Fee</span>
              <span className="font-mono font-semibold">
                {priorityFeeInGwei ? `${parseFloat(priorityFeeInGwei).toFixed(4)} Gwei` : 'N/A'}
              </span>
            </div>

            <Separator />

            {latestBlock?.baseFeePerGas && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Base Fee</span>
                  <span className="font-mono font-semibold">
                    {parseFloat(formatGwei(latestBlock.baseFeePerGas)).toFixed(4)} Gwei
                  </span>
                </div>
                <Separator />
              </>
            )}

            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Gas prices are dynamically adjusted based on network congestion. 
                Higher priority fees get faster inclusion in blocks.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Block Details */}
      {latestBlock && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Block Details</CardTitle>
            <CardDescription>
              Block #{latestBlock.number.toString()} • {' '}
              {new Date(Number(latestBlock.timestamp) * 1000).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Block Hash</span>
                <code className="block text-xs font-mono bg-muted p-2 rounded break-all">
                  {latestBlock.hash}
                </code>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Transactions</span>
                <div className="text-2xl font-bold">{latestBlock.transactions}</div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Gas Used / Limit</span>
                <div className="text-lg font-mono">
                  {latestBlock.gasUsed.toString()} / {latestBlock.gasLimit.toString()}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Gas Utilization</span>
                <div className="text-2xl font-bold">
                  {((Number(latestBlock.gasUsed) / Number(latestBlock.gasLimit)) * 100).toFixed(2)}%
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Miner/Validator</span>
                <code className="block text-xs font-mono bg-muted p-2 rounded break-all">
                  {latestBlock.miner}
                </code>
              </div>

              <div className="space-y-1">
                <span className="text-sm text-muted-foreground">Timestamp</span>
                <div className="text-sm">
                  {new Date(Number(latestBlock.timestamp) * 1000).toLocaleString()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}