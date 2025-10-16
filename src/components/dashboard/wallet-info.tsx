
"use client";

import { useAccount, useBalance, useBlockNumber } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUnits } from "viem";
import { andechanTestnet } from "@/lib/chains";

export function WalletInfo() {
  const { address, isConnected, chain } = useAccount();
  
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    watch: true,
  });

  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({ watch: true });
  
  const isCorrectNetwork = chain?.id === andechanTestnet.id;

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Wallet</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Please connect your wallet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Network Status</CardTitle>
      </CardHeader>
      <CardContent>
        {isCorrectNetwork ? (
          <div className="flex items-center gap-2">
             <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {andechanTestnet.name}
                </p>
                {isBlockLoading ? <Skeleton className="h-4 w-20 mt-1" /> : <p className="text-xs text-muted-foreground">Block: {blockNumber?.toString()}</p>}
              </div>
          </div>
        ) : (
           <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
             <p className="text-sm font-semibold text-destructive">
              Wrong Network
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
