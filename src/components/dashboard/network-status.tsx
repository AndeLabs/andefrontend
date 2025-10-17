
"use client";

import { memo } from 'react';
import { useAccount, useBlockNumber, useFeeData } from "wagmi";
import { formatGwei } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { andechain } from "@/lib/chains";
import { Separator } from "../ui/separator";
import { useChainStats } from "@/hooks/use-chain-stats";
import { Activity, Zap, Layers, Clock } from "lucide-react";

function NetworkStatusComponent() {
  const { isConnected, chain } = useAccount();
  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({ 
    watch: true,
    chainId: andechain.id,
  });
  const { data: feeData, isLoading: isFeeLoading } = useFeeData({
      chainId: andechain.id,
  });
  const { tps, avgBlockTime, isLoading: isStatsLoading } = useChainStats();
  
  const isCorrectNetwork = !isConnected || chain?.id === andechain.id;
  const gasPriceInGwei = feeData?.gasPrice ? formatGwei(feeData.gasPrice) : null;

  const renderStatus = () => {
    if (!isConnected) {
      return (
        <Badge variant="outline" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
          Ready
        </Badge>
      );
    }
    if (!isCorrectNetwork) {
      return (
        <Badge variant="destructive" className="gap-2">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-300"></span>
          </span>
          Wrong Network
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-2 bg-green-500 hover:bg-green-600">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-100"></span>
        </span>
        Connected
      </Badge>
    );
  };
  
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Network Status</CardTitle>
            <CardDescription className="mt-1">{andechain.name}</CardDescription>
          </div>
          {renderStatus()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Zap className="h-4 w-4" />
              <span>Gas Price</span>
            </div>
            {isFeeLoading ? (
              <Skeleton className="h-7 w-20" />
            ) : (
              <div className="text-2xl font-bold">
                {gasPriceInGwei ? parseFloat(gasPriceInGwei).toFixed(4) : 'N/A'}
              </div>
            )}
            {gasPriceInGwei && (
              <p className="text-xs text-muted-foreground">Gwei</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Activity className="h-4 w-4" />
              <span>TPS</span>
            </div>
            {isStatsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{tps}</div>
            )}
            <p className="text-xs text-muted-foreground">tx/second</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Layers className="h-4 w-4" />
              <span>Latest Block</span>
            </div>
            {isBlockLoading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <div className="text-2xl font-bold tabular-nums">
                {blockNumber?.toString() || '—'}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-4 w-4" />
              <span>Block Time</span>
            </div>
            {isStatsLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="text-2xl font-bold">{avgBlockTime}</div>
            )}
            <p className="text-xs text-muted-foreground">seconds</p>
          </div>
        </div>

        <Separator />

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Chain ID</span>
          <span className="font-mono font-semibold">{andechain.id}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">RPC Endpoint</span>
          <span className="font-mono text-xs truncate max-w-[150px]">
            {andechain.rpcUrls.default.http[0]}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export const NetworkStatus = memo(NetworkStatusComponent);
