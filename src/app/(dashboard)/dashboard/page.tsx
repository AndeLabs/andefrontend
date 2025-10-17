
'use client';

import dynamic from 'next/dynamic';
import { DollarSign, Landmark, Wallet } from "lucide-react";
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { formatUnits } from 'viem';

import { BalanceCard } from "@/components/dashboard/balance-card";
import { NetworkStatusCompact } from "@/components/dashboard/network-status-compact";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { andechain } from '@/lib/chains';
import { ANDECHAIN_CONTRACTS } from '@/contracts/addresses';
import ANDETokenABI from '@/contracts/abis/ANDEToken.json';

const OverviewChart = dynamic(() => 
  import('@/components/dashboard/overview-chart').then(mod => mod.OverviewChart),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  }
);

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  
  const { data: nativeBalance, isLoading: isNativeLoading } = useBalance({
    address: address,
    chainId: andechain.id,
  });

  const { data: andeTokenBalance, isLoading: isTokenLoading } = useReadContract({
    address: ANDECHAIN_CONTRACTS.ANDEToken as `0x${string}`,
    abi: ANDETokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: andechain.id,
    query: {
      enabled: !!address && isConnected,
    }
  });

  const formattedNativeBalance = nativeBalance 
    ? parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4) 
    : '0.00';
    
  const formattedTokenBalance = andeTokenBalance 
    ? parseFloat(formatUnits(andeTokenBalance as bigint, 18)).toFixed(2) 
    : '0.00';

  const andePrice = 2.30;
  const totalValue = parseFloat(formattedNativeBalance) * andePrice + parseFloat(formattedTokenBalance) * andePrice;
  
  const nativeBalanceDisplay = isConnected ? `${formattedNativeBalance} ${nativeBalance?.symbol || 'ANDE'}` : '0.00 ANDE';
  const tokenBalanceDisplay = isConnected ? `${formattedTokenBalance} ANDE` : '0.00 ANDE';
  const totalBalanceDisplay = isConnected ? `$${totalValue.toFixed(2)}` : '$0.00';

  const portfolioData = [
    { 
      asset: 'ANDE Token', 
      balance: tokenBalanceDisplay, 
      value: `$${(parseFloat(formattedTokenBalance) * andePrice).toFixed(2)}`,
      allocation: totalValue > 0 ? `${((parseFloat(formattedTokenBalance) * andePrice / totalValue) * 100).toFixed(1)}%` : '0%'
    },
    { 
      asset: 'Native ANDE', 
      balance: nativeBalanceDisplay, 
      value: `$${(parseFloat(formattedNativeBalance) * andePrice).toFixed(2)}`,
      allocation: totalValue > 0 ? `${((parseFloat(formattedNativeBalance) * andePrice / totalValue) * 100).toFixed(1)}%` : '0%'
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <div className="lg:col-span-1">
          <BalanceCard 
            title="Total Balance"
            balance={totalBalanceDisplay}
            usdValue={`${parseFloat(formattedTokenBalance) + parseFloat(formattedNativeBalance)} ANDE`}
            change="+2.5%"
            icon={<DollarSign />}
            isLoading={(isNativeLoading || isTokenLoading) && isConnected}
          />
      </div>
       <div className="lg:col-span-1">
          <BalanceCard 
            title="ANDE Token"
            balance={tokenBalanceDisplay}
            usdValue={`~$${(parseFloat(formattedTokenBalance) * andePrice).toFixed(2)}`}
            change="+1.8%"
            icon={<Wallet />}
            isLoading={isTokenLoading && isConnected}
          />
      </div>
      <div className="lg:col-span-1">
          <BalanceCard 
            title="Native Balance"
            balance={nativeBalanceDisplay}
            usdValue={`~$${(parseFloat(formattedNativeBalance) * andePrice).toFixed(2)}`}
            change="+0.5%"
            icon={<Landmark />}
            isLoading={isNativeLoading && isConnected}
          />
      </div>
      <div className="lg:col-span-1">
         <NetworkStatusCompact />
      </div>

      <div className="lg:col-span-3">
        <OverviewChart />
      </div>
      <div className="lg:col-span-1">
        <Card>
            <CardHeader>
                <CardTitle>Portfolio</CardTitle>
                <CardDescription>Asset allocation</CardDescription>
            </CardHeader>
            <CardContent>
                {isConnected ? (
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Asset</TableHead>
                              <TableHead className="text-right">Allocation</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {portfolioData.map(asset => (
                              <TableRow key={asset.asset}>
                                  <TableCell>
                                      <div className="font-medium">{asset.asset}</div>
                                      <div className="text-xs text-muted-foreground">{asset.balance}</div>
                                  </TableCell>
                                  <TableCell className="text-right">{asset.allocation}</TableCell>
                              </TableRow>
                          ))}
                      </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Connect your wallet to view portfolio
                  </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
