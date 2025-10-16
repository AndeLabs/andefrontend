
"use client";

import { memo } from 'react';
import { useAccount, useBlockNumber } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { andechanTestnet } from "@/lib/chains";
import { Separator } from "../ui/separator";

function NetworkStatusComponent() {
  const { isConnected, chain } = useAccount();
  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({ watch: true });
  
  const isCorrectNetwork = chain?.id === andechanTestnet.id;

  const renderStatus = () => {
    if (!isConnected) {
      return <p className="text-sm text-muted-foreground">Please connect your wallet.</p>;
    }
    if (!isCorrectNetwork) {
      return (
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <p className="text-sm font-semibold text-destructive">Wrong Network</p>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <p className="text-sm font-semibold text-green-500">Operational</p>
      </div>
    );
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Network Status</CardTitle>
        <CardDescription className="text-xs">{andechanTestnet.name}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Status</span>
            {renderStatus()}
          </div>
          <Separator />
           <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">Gas Price</div>
                  <div className="font-semibold">5 Gwei</div>
                </div>
                <div>
                  <div className="text-muted-foreground">TPS</div>
                  <div className="font-semibold">24.5</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Latest Block</div>
                   {isBlockLoading ? <Skeleton className="h-5 w-16 mt-1" /> : <div className="font-semibold">{blockNumber?.toString()}</div>}
                </div>
                 <div>
                  <div className="text-muted-foreground">Uptime</div>
                  <div className="font-semibold">99.98%</div>
                </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const NetworkStatus = memo(NetworkStatusComponent);
