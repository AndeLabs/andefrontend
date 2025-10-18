'use client';

import dynamic from 'next/dynamic';
import { DollarSign, Landmark, Wallet, TrendingUp } from "lucide-react";
import { useAccount } from 'wagmi';

import { BalanceCard } from "@/components/dashboard/balance-card";
import { NetworkStatusCompact } from "@/components/dashboard/network-status-compact";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import { useAndeBalance } from '@/hooks/use-ande-balance';
import { andechain } from '@/lib/chains';

const OverviewChart = dynamic(() => 
  import('@/components/dashboard/overview-chart').then(mod => mod.OverviewChart),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  }
);

export function DashboardContent() {
  const { address, isConnected } = useAccount();
  const { balance: andeBalance, isLoading: isAndeLoading } = useAndeBalance();

  const formattedAndeBalance = andeBalance 
    ? parseFloat(andeBalance.formatted).toFixed(2) 
    : '0.00';

  const andePrice = 2.30; // Precio simulado de ANDE en USD
  const totalValue = parseFloat(formattedAndeBalance) * andePrice;
  
  const andeBalanceDisplay = isConnected ? `${formattedAndeBalance} ANDE` : '0.00 ANDE';
  const totalBalanceDisplay = isConnected ? `$${totalValue.toFixed(2)}` : '$0.00';

  const portfolioData = [
    { 
      asset: 'ANDE', 
      balance: andeBalanceDisplay, 
      value: `$${(parseFloat(formattedAndeBalance) * andePrice).toFixed(2)}`,
      allocation: '100%'
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* ANDE Balance Card */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="ANDE Balance"
          balance={andeBalanceDisplay}
          usdValue={totalBalanceDisplay}
          change="+2.5%"
          icon={<Wallet />}
          isLoading={isAndeLoading && isConnected}
        />
      </div>

      {/* Total Value Card */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="Total Value"
          balance={totalBalanceDisplay}
          usdValue={`${formattedAndeBalance} ANDE`}
          change="+1.8%"
          icon={<DollarSign />}
          isLoading={isAndeLoading && isConnected}
        />
      </div>

      {/* ANDE Price Card */}
      <div className="lg:col-span-1">
        <BalanceCard 
          title="ANDE Price"
          balance={`$${andePrice.toFixed(2)}`}
          usdValue="Native Currency"
          change="+0.5%"
          icon={<TrendingUp />}
          isLoading={false}
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
            <CardTitle>Portfolio</CardTitle>
            <CardDescription>Asset allocation</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Asset</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {portfolioData.map((item) => (
                  <TableRow key={item.asset}>
                    <TableCell className="font-medium">{item.asset}</TableCell>
                    <TableCell className="text-right">{item.balance}</TableCell>
                    <TableCell className="text-right">{item.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="lg:col-span-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest transactions on {andechain.name}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground py-8">
              {isConnected ? (
                <p>No recent activity to display</p>
              ) : (
                <p>Connect your wallet to view activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}