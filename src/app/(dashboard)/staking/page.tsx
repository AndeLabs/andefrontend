
'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Info, Zap, Gift } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStaking, tiers, lockPeriods } from '@/hooks/use-staking.tsx';

export default function StakingPage() {
  const {
    selectedTier,
    setSelectedTier,
    amount,
    setAmount,
    lockPeriodIndex,
    setLockPeriodIndex,
    lockDetails,
    finalApy,
    yearlyReward,
    monthlyReward,
  } = useStaking();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Start Staking</CardTitle>
            <CardDescription>
              Choose your tier, lock period, and amount to start earning rewards.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Select Staking Tier</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                {tiers.map((tier) => (
                  <Card
                    key={tier.id}
                    className={`cursor-pointer transition-all ${
                      selectedTier.id === tier.id
                        ? 'border-primary ring-2 ring-primary shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedTier(tier)}
                  >
                    <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                      {tier.icon}
                      <CardTitle className="text-lg">{tier.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {tier.description}
                      </p>
                      <p className="text-sm font-bold mt-2">
                        Base APY: {tier.apy}%
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to Stake</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-16"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center">
                    <span className="pr-4 text-sm font-medium text-muted-foreground">
                      AND
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lock Period: {lockDetails.months} months</Label>
                <Slider
                  value={[lockPeriodIndex]}
                  onValueChange={(value) => setLockPeriodIndex(value[0])}
                  max={lockPeriods.length - 1}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  {lockPeriods.map((p) => (
                    <span key={p.months}>{p.months}m</span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Vesting Period</AlertTitle>
          <AlertDescription>
            Unstaked assets are subject to a 14-day vesting period before they can be withdrawn. Rewards can be claimed at any time.
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Estimated Rewards</CardTitle>
            <CardDescription>Based on your selected options.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Final APY</span>
              <span className="font-bold text-lg text-green-500">
                {finalApy.toFixed(2)}%
              </span>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Base APY</span>
                <span>{selectedTier.apy.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Lock Bonus ({lockDetails.months} mo)
                </span>
                <span>x{lockDetails.multiplier}</span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <Gift className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Est. Monthly Reward</span>
                <span className="font-medium">{monthlyReward.toFixed(4)} AND</span>
              </div>
              <div className="flex justify-between text-sm">
                <Gift className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-muted-foreground">Est. Yearly Reward</span>
                <span className="font-medium">{yearlyReward.toFixed(4)} AND</span>
              </div>
            </div>
            <Button className="w-full" size="lg">
              <Zap className="mr-2" /> Stake Now
            </Button>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>My Staked Positions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="p-4 rounded-lg border">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold">1,500.00 AND</p>
                                <Badge variant="secondary" className="mt-1">{tiers.find(t => t.id === 'governance')?.name}</Badge>
                            </div>
                            <Button size="sm" variant="outline">Unstake</Button>
                        </div>
                        <Separator className="my-3" />
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>Lock Period: 12 months</p>
                            <p>Unlocks in: 8 months, 12 days</p>
                            <p className="font-medium text-green-500">Rewards to claim: 45.12 AND</p>
                        </div>
                        <Button size="sm" className="w-full mt-3">Claim Rewards</Button>
                    </div>
                     <p className="text-center text-sm text-muted-foreground pt-4">No other staking positions found.</p>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
