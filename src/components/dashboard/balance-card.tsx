import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowUpRight } from "lucide-react";

interface BalanceCardProps {
  title: string;
  balance: string;
  usdValue: string;
  change: string;
  icon: React.ReactNode;
}

export function BalanceCard({ title, balance, usdValue, change, icon }: BalanceCardProps) {
  const isPositive = !change.startsWith('-');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{balance}</div>
        <p className="text-xs text-muted-foreground">{usdValue} USD</p>
        <div className="flex items-center gap-2 text-xs mt-2">
            <span className={`flex items-center gap-1 font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                <ArrowUpRight className={`h-4 w-4 ${!isPositive && 'rotate-180'}`} />
                {change}
            </span>
            <span className="text-muted-foreground">in last 24h</span>
        </div>
      </CardContent>
    </Card>
  );
}
