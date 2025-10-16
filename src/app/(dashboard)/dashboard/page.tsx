
'use client';

import dynamic from 'next/dynamic';
import { DollarSign, Landmark, Wallet } from "lucide-react";
import { useAccount, useBalance } from 'wagmi';
import { formatUnits } from 'viem';

import { BalanceCard } from "@/components/dashboard/balance-card";
import { NetworkStatus } from "@/components/dashboard/network-status";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { andechanTestnet } from '@/lib/chains';

const OverviewChart = dynamic(() => 
  import('@/components/dashboard/overview-chart').then(mod => mod.OverviewChart),
  { 
    ssr: false,
    loading: () => <Skeleton className="h-[280px] w-full" />,
  }
);

const portfolioData = [
    { asset: 'AndeChain (AND)', balance: '1,250.50', value: '$2,876.15', allocation: '45%' },
    { asset: 'Ethereum (ETH)', balance: '0.50', value: '$1,750.00', allocation: '30%' },
    { asset: 'USD Coin (USDC)', balance: '1,000.00', value: '$1,000.00', allocation: '15%' },
    { asset: 'Staked AND', balance: '500.00', value: '$1,150.00', allocation: '10%' },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address: address,
    chainId: andechanTestnet.id,
  });

  const formattedBalance = balance ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(2) : '0.00';
  const balanceDisplay = isConnected ? `${formattedBalance} ${balance?.symbol}` : '$0.00';
  const usdValueDisplay = isConnected ? `~$${(parseFloat(formattedBalance) * 2.3).toFixed(2)} USD` : 'USD'; // Dummy price

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Top Row Cards */}
      <div className="lg:col-span-1">
          <BalanceCard 
            title="Total Balance"
            balance={balanceDisplay}
            usdValue={usdValueDisplay}
            change="+2.5%"
            icon={<DollarSign />}
            isLoading={isBalanceLoading && isConnected}
          />
      </div>
       <div className="lg:col-span-1">
          <BalanceCard 
            title="Wallet Balance"
            balance={balanceDisplay}
            usdValue={usdValueDisplay}
            change="+1.8%"
            icon={<Wallet />}
            isLoading={isBalanceLoading && isConnected}
          />
      </div>
      <div className="lg:col-span-1">
          <BalanceCard 
            title="Staking Balance"
            balance="$1,150.00"
            usdValue="15.2% APY"
            change="+0.5%"
            icon={<Landmark />}
            isLoading={false} // Staking data is static for now
          />
      </div>
      <div className="lg:col-span-1">
         <NetworkStatus />
      </div>

      {/* Main Content Area */}
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
