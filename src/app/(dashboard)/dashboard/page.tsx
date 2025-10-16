
'use client';

import { DollarSign, Landmark, Wallet } from "lucide-react";
import { BalanceCard } from "@/components/dashboard/balance-card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { WalletInfo } from "@/components/dashboard/wallet-info";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const portfolioData = [
    { asset: 'AndeChain (AND)', balance: '1,250.50', value: '$2,876.15', allocation: '45%' },
    { asset: 'Ethereum (ETH)', balance: '0.50', value: '$1,750.00', allocation: '30%' },
    { asset: 'USD Coin (USDC)', balance: '1,000.00', value: '$1,000.00', allocation: '15%' },
    { asset: 'Staked AND', balance: '500.00', value: '$1,150.00', allocation: '10%' },
]

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Top Row Cards */}
      <div className="lg:col-span-1">
          <BalanceCard 
            title="Total Balance"
            balance="$6,776.15"
            usdValue="USD"
            change="+2.5%"
            icon={<DollarSign />}
          />
      </div>
       <div className="lg:col-span-1">
          <BalanceCard 
            title="Wallet Balance"
            balance="$5,626.15"
            usdValue="USD"
            change="+1.8%"
            icon={<Wallet />}
          />
      </div>
      <div className="lg:col-span-1">
          <BalanceCard 
            title="Staking Balance"
            balance="$1,150.00"
            usdValue="15.2% APY"
            change="+0.5%"
            icon={<Landmark />}
          />
      </div>
      <div className="lg:col-span-1">
         <WalletInfo />
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
