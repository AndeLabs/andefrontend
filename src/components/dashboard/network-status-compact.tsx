'use client';

import { memo } from 'react';
import Link from 'next/link';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { andechainTestnet as andechain } from '@/lib/chains';
import { Separator } from '../ui/separator';
import { useChainMetrics, useGasPrice, useBlockNumber } from '@/hooks/use-blockchain-v2';
import { Activity, Zap, Layers, Clock, ExternalLink, Signal } from 'lucide-react';

function NetworkStatusCompactComponent() {
  const { isConnected, chain } = useAccount();
  const { data: metrics, isLoading: metricsLoading } = useChainMetrics();
  const { data: gasPrice, isLoading: gasLoading } = useGasPrice();
  const { data: blockNumber, isLoading: blockLoading } = useBlockNumber({ watch: true });

  const isCorrectNetwork = !isConnected || chain?.id === andechain.id;
  const isLoading = metricsLoading || gasLoading || blockLoading;

  const renderStatus = () => {
    if (!isConnected) {
      return (
        <Badge variant="outline" className="gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
          </span>
          Ready
        </Badge>
      );
    }

    if (!isCorrectNetwork) {
      return (
        <Badge variant="destructive" className="gap-1.5">
          <span className="relative flex h-1.5 w-1.5 bg-red-300 rounded-full"></span>
          Wrong Network
        </Badge>
      );
    }

    return (
      <Badge
        variant="default"
        className="gap-1.5 bg-green-500 hover:bg-green-600"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-100"></span>
        </span>
        Connected
      </Badge>
    );
  };

  const renderMetric = (label: string, value: string | number, icon: React.ReactNode, loading: boolean) => (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
        {icon}
        <span>{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-5 w-16" />
      ) : (
        <div className="font-semibold text-sm tabular-nums">{value}</div>
      )}
    </div>
  );

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Network</CardTitle>
            <CardDescription className="text-xs mt-0.5">{andechain.name}</CardDescription>
          </div>
          {renderStatus()}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Network Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {renderMetric(
            'Gas Price',
            isLoading || !gasPrice
              ? '—'
              : `${parseFloat(formatEther(gasPrice)).toFixed(4)} Gwei`,
            <Zap className="h-3 w-3" />,
            gasLoading
          )}

          {renderMetric(
            'TPS',
            isLoading || !metrics ? '—' : metrics.tps.toFixed(2),
            <Activity className="h-3 w-3" />,
            metricsLoading
          )}

          {renderMetric(
            'Block #',
            isLoading || !blockNumber ? '—' : blockNumber.toString(),
            <Layers className="h-3 w-3" />,
            blockLoading
          )}

          {renderMetric(
            'Block Time',
            isLoading || !metrics ? '—' : `${(metrics.blockTime / 1000).toFixed(1)}s`,
            <Clock className="h-3 w-3" />,
            metricsLoading
          )}
        </div>

        {/* Health Status */}
        <div className="flex items-center gap-2 text-xs">
          <Signal className={`h-3 w-3 ${metrics?.networkHealth === 'healthy' ? 'text-green-500' : 'text-yellow-500'}`} />
          <span className="text-muted-foreground">
            Network Status: <span className="font-medium capitalize">{metrics?.networkHealth || 'unknown'}</span>
          </span>
        </div>

        <Separator />

        <Link href="/network">
          <Button variant="outline" size="sm" className="w-full gap-2">
            View Details
            <ExternalLink className="h-3 w-3" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export const NetworkStatusCompact = memo(NetworkStatusCompactComponent);