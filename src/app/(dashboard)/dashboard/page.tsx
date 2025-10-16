import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { OverviewChart } from "@/components/dashboard/overview-chart"
import { WalletInfo } from "@/components/dashboard/wallet-info"

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
       <WalletInfo />
       <div className="col-span-1 lg:col-span-4">
        <OverviewChart />
      </div>
    </div>
  )
}
