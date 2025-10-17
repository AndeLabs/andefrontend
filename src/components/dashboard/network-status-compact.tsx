"use client";

import { memo } from 'react';
import Link from 'next/link';
import { useAccount, useBlockNumber, useFeeData } from "wagmi";
import { formatGwei } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { andechain } from "@/lib/chains";
import { Separator } from "../ui/separator";
import { useChainStats } from "@/hooks/use-chain-stats";
import { Activity, Zap, Layers, Clock, ExternalLink } from "lucide-react";

function NetworkStatusCompactComponent() {
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
      <Badge variant="default" className="gap-1.5 bg-green-500 hover:bg-green-600">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-100"></span>
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
            <CardTitle className="text-base">Network</CardTitle>
            <CardDescription className="text-xs mt-0.5">{andechain.name}</CardDescription>
          </div>
          {renderStatus()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Zap className="h-3 w-3" />
              <span>Gas</span>
            </div>
            {isFeeLoading ? (
              <Skeleton className="h-5 w-16" />
            ) : (
              <div className="font-semibold tabular-nums">
                {gasPriceInGwei ? parseFloat(gasPriceInGwei).toFixed(2) : 'N/A'}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Activity className="h-3 w-3" />
              <span>TPS</span>
            </div>
            {isStatsLoading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <div className="font-semibold">{tps}</div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Layers className="h-3 w-3" />
              <span>Block</span>
            </div>
            {isBlockLoading ? (
              <Skeleton className="h-5 w-20" />
            ) : (
              <div className="font-semibold tabular-nums text-sm">
                {blockNumber?.toString() || '—'}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <Clock className="h-3 w-3" />
              <span>Time</span>
            </div>
            {isStatsLoading ? (
              <Skeleton className="h-5 w-12" />
            ) : (
              <div className="font-semibold">{avgBlockTime}s</div>
            )}
          </div>
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
