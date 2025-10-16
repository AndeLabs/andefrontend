"use client";

import { useAccount, useBalance, useBlockNumber } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Wallet Not Connected</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Please connect your wallet to view your information.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>AndeChain Wallet</CardTitle>
        {isCorrectNetwork ? (
           <Badge variant="default" className="bg-green-500 hover:bg-green-600">Connected</Badge>
        ) : (
          <Badge variant="destructive">Wrong Network</Badge>
        )}
      </CardHeader>
      <CardContent className="grid gap-4">
        {isCorrectNetwork ? (
          <>
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              {isBalanceLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <p className="text-2xl font-bold">
                  {balance ? `${parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)} ${balance.symbol}` : '0.0000 AND'}
                </p>
              )}
            </div>
             <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Network Status</p>
              <div className="flex items-center gap-2">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <p className="text-sm">
                    {andechanTestnet.name}
                  </p>
                  {isBlockLoading ? <Skeleton className="h-4 w-20" /> : <p className="text-sm text-muted-foreground">Block: {blockNumber?.toString()}</p>}
              </div>
            </div>
          </>
        ) : (
          <p className="text-destructive">
            Please switch to the AndeChain Testnet in your wallet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
