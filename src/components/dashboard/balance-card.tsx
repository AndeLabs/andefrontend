
'use client';
import { memo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface BalanceCardProps {
  title: string;
  balance: string | null;
  usdValue?: string | null;
  change?: string | null;
  icon: React.ReactNode;
  isLoading?: boolean;
}

function BalanceCardComponent({ title, balance, usdValue, change, icon, isLoading }: BalanceCardProps) {
  const isPositive = change && !change.startsWith('-');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <Skeleton className="h-8 w-3/4 mt-1 mb-2" />
        ) : (
            <div className="text-2xl font-bold">{balance}</div>
        )}
        
        {isLoading ? (
            <Skeleton className="h-4 w-1/2" />
        ): (
            <p className="text-xs text-muted-foreground">{usdValue}</p>
        )}
        
        {change && !isLoading && (
            <div className="flex items-center gap-2 text-xs mt-2">
                <span className={`flex items-center gap-1 font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    <ArrowUpRight className={`h-4 w-4 ${!isPositive && 'transform rotate-180'}`} />
                    {change}
                </span>
                <span className="text-muted-foreground">in last 24h</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}

export const BalanceCard = memo(BalanceCardComponent);
