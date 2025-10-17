'use client';

import { useState, useEffect } from 'react';
import { useAccount, useBalance, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { andechain } from '@/lib/chains';
import {
  Landmark,
  TrendingUp,
  Lock,
  Unlock,
  Gift,
  Clock,
  Percent,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Coins,
  Calendar,
  Trophy,
  Zap,
} from 'lucide-react';

interface StakingStats {
  totalStaked: string;
  myStaked: string;
  rewards: string;
  apr: number;
  lockPeriod: number;
  minStake: string;
}

interface StakePosition {
  amount: string;
  startTime: number;
  unlockTime: number;
  rewards: string;
  isLocked: boolean;
}

export default function StakingPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address, chainId: andechain.id });
  const { toast } = useToast();

  // Staking state
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [isStaking, setIsStaking] = useState(false);
  const [isUnstaking, setIsUnstaking] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  // Mock staking stats (en producción, esto vendría del contrato)
  const [stakingStats, setStakingStats] = useState<StakingStats>({
    totalStaked: '1250000',
    myStaked: '0',
    rewards: '0',
    apr: 12.5,
    lockPeriod: 30,
    minStake: '10',
  });

  // Mock stake positions (en producción, esto vendría del contrato)
  const [positions, setPositions] = useState<StakePosition[]>([]);

  useEffect(() => {
    // Simular carga de posiciones de staking
    if (isConnected && address) {
      // En producción, cargar desde el contrato
      const mockPosition: StakePosition = {
        amount: '100',
        startTime: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 días atrás
        unlockTime: Date.now() + 15 * 24 * 60 * 60 * 1000, // 15 días adelante
        rewards: '1.56',
        isLocked: true,
      };
      
      setPositions([mockPosition]);
      setStakingStats(prev => ({ ...prev, myStaked: '100', rewards: '1.56' }));
    }
  }, [isConnected, address]);

  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) < parseFloat(stakingStats.minStake)) {
      toast({
        title: 'Invalid Amount',
        description: `Minimum stake is ${stakingStats.minStake} ANDE`,
        variant: 'destructive',
      });
      return;
    }

    setIsStaking(true);
    try {
      // Simulación de staking (en producción, llamar al contrato)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newPosition: StakePosition = {
        amount: stakeAmount,
        startTime: Date.now(),
        unlockTime: Date.now() + stakingStats.lockPeriod * 24 * 60 * 60 * 1000,
        rewards: '0',
        isLocked: true,
      };

      setPositions(prev => [...prev, newPosition]);
      setStakingStats(prev => ({
        ...prev,
        myStaked: (parseFloat(prev.myStaked) + parseFloat(stakeAmount)).toString(),
        totalStaked: (parseFloat(prev.totalStaked) + parseFloat(stakeAmount)).toString(),
      }));

      toast({
        title: '✅ Staking Successful',
        description: `Successfully staked ${stakeAmount} ANDE`,
      });

      setStakeAmount('');
    } catch (error) {
      console.error('Stake error:', error);
      toast({
        title: 'Staking Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsStaking(false);
    }
  };

  const handleUnstake = async (position: StakePosition) => {
    if (position.isLocked && position.unlockTime > Date.now()) {
      toast({
        title: 'Position Locked',
        description: 'You cannot unstake before the lock period ends',
        variant: 'destructive',
      });
      return;
    }

    setIsUnstaking(true);
    try {
      // Simulación de unstaking (en producción, llamar al contrato)
      await new Promise(resolve => setTimeout(resolve, 2000));

      setPositions(prev => prev.filter(p => p !== position));
      setStakingStats(prev => ({
        ...prev,
        myStaked: (parseFloat(prev.myStaked) - parseFloat(position.amount)).toString(),
        totalStaked: (parseFloat(prev.totalStaked) - parseFloat(position.amount)).toString(),
        rewards: (parseFloat(prev.rewards) - parseFloat(position.rewards)).toString(),
      }));

      toast({
        title: '✅ Unstaking Successful',
        description: `Unstaked ${position.amount} ANDE`,
      });
    } catch (error) {
      console.error('Unstake error:', error);
      toast({
        title: 'Unstaking Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsUnstaking(false);
    }
  };

  const handleClaimRewards = async () => {
    if (parseFloat(stakingStats.rewards) === 0) {
      toast({
        title: 'No Rewards',
        description: 'You have no rewards to claim',
        variant: 'destructive',
      });
      return;
    }

    setIsClaiming(true);
    try {
      // Simulación de claim (en producción, llamar al contrato)
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: '✅ Rewards Claimed',
        description: `Claimed ${stakingStats.rewards} ANDE`,
      });

      setStakingStats(prev => ({ ...prev, rewards: '0' }));
      setPositions(prev => prev.map(p => ({ ...p, rewards: '0' })));
    } catch (error) {
      console.error('Claim error:', error);
      toast({
        title: 'Claim Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTimeRemaining = (timestamp: number): string => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Unlocked';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const calculateProgress = (startTime: number, unlockTime: number): number => {
    const total = unlockTime - startTime;
    const elapsed = Date.now() - startTime;
    return Math.min((elapsed / total) * 100, 100);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Landmark className="h-8 w-8 text-blue-500" />
          Staking
        </h1>
        <p className="text-muted-foreground mt-2">
          Stake your ANDE tokens and earn rewards on {andechain.name}
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(stakingStats.totalStaked).toLocaleString()} ANDE
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Network-wide
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Staked</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(stakingStats.myStaked).toFixed(2)} ANDE
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your total stake
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {parseFloat(stakingStats.rewards).toFixed(4)} ANDE
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Claimable rewards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">APR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stakingStats.apr}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Annual percentage rate
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="stake" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stake">Stake</TabsTrigger>
          <TabsTrigger value="positions">My Positions</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
        </TabsList>

        {/* Stake Tab */}
        <TabsContent value="stake" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Stake ANDE Tokens</CardTitle>
                <CardDescription>
                  Lock your tokens for {stakingStats.lockPeriod} days and earn {stakingStats.apr}% APR
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {!isConnected ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Wallet Not Connected</AlertTitle>
                    <AlertDescription>
                      Please connect your wallet to stake tokens
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="stake-amount">Amount to Stake</Label>
                      <Input
                        id="stake-amount"
                        type="number"
                        step="0.000001"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.0"
                      />
                      {balance && (
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Available: {parseFloat(formatEther(balance.value)).toFixed(6)} ANDE</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setStakeAmount(formatEther(balance.value))}
                          >
                            Max
                          </Button>
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Minimum Stake</span>
                        <span className="font-semibold">{stakingStats.minStake} ANDE</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Lock Period</span>
                        <Badge variant="outline">{stakingStats.lockPeriod} days</Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">APR</span>
                        <span className="font-semibold text-green-500">{stakingStats.apr}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Est. Rewards (30d)</span>
                        <span className="font-semibold">
                          {stakeAmount ? ((parseFloat(stakeAmount) * stakingStats.apr / 100 / 12)).toFixed(4) : '0.0000'} ANDE
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={handleStake}
                      disabled={isStaking || !stakeAmount || parseFloat(stakeAmount) < parseFloat(stakingStats.minStake)}
                      className="w-full"
                      size="lg"
                    >
                      {isStaking ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Staking...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Stake Tokens
                        </>
                      )}
                    </Button>

                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Important</AlertTitle>
                      <AlertDescription>
                        Your tokens will be locked for {stakingStats.lockPeriod} days. Early withdrawal is not possible.
                        Rewards are calculated automatically and can be claimed at any time.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Percent className="h-4 w-4" />
                    Staking Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">High APR</p>
                      <p className="text-xs text-muted-foreground">
                        Earn {stakingStats.apr}% annual returns
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Auto-Compounding</p>
                      <p className="text-xs text-muted-foreground">
                        Rewards accrue automatically
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Secure Protocol</p>
                      <p className="text-xs text-muted-foreground">
                        Audited smart contracts
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-sm">Flexible Claims</p>
                      <p className="text-xs text-muted-foreground">
                        Claim rewards anytime
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Stakers</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Stake</span>
                    <span className="font-semibold">1,013 ANDE</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Rewards</span>
                    <span className="font-semibold">12,500 ANDE</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* My Positions Tab */}
        <TabsContent value="positions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5" />
                My Staking Positions
              </CardTitle>
              <CardDescription>
                View and manage your active stakes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isConnected ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Connect your wallet to view positions</p>
                </div>
              ) : positions.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active staking positions</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Start staking to earn rewards
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {positions.map((position, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border bg-muted/50"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="font-semibold text-lg">{position.amount} ANDE</p>
                          <p className="text-xs text-muted-foreground">
                            Staked on {new Date(position.startTime).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={position.isLocked ? 'default' : 'secondary'}>
                          {position.isLocked ? (
                            <>
                              <Lock className="h-3 w-3 mr-1" />
                              Locked
                            </>
                          ) : (
                            <>
                              <Unlock className="h-3 w-3 mr-1" />
                              Unlocked
                            </>
                          )}
                        </Badge>
                      </div>

                      {position.isLocked && (
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Time Remaining</span>
                            <span className="font-semibold flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTimeRemaining(position.unlockTime)}
                            </span>
                          </div>
                          <Progress value={calculateProgress(position.startTime, position.unlockTime)} />
                        </div>
                      )}

                      <Separator className="my-4" />

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Rewards Earned</p>
                          <p className="font-semibold text-green-500">{position.rewards} ANDE</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Unlock Date</p>
                          <p className="font-semibold text-sm">
                            {new Date(position.unlockTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleUnstake(position)}
                        disabled={isUnstaking || (position.isLocked && position.unlockTime > Date.now())}
                        className="w-full"
                        variant={position.isLocked && position.unlockTime > Date.now() ? 'secondary' : 'default'}
                      >
                        {isUnstaking ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Unstaking...
                          </>
                        ) : position.isLocked && position.unlockTime > Date.now() ? (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Locked
                          </>
                        ) : (
                          <>
                            <Unlock className="mr-2 h-4 w-4" />
                            Unstake
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Claim Rewards
              </CardTitle>
              <CardDescription>
                Claim your accumulated staking rewards
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isConnected ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Wallet Not Connected</AlertTitle>
                  <AlertDescription>
                    Please connect your wallet to view rewards
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="text-center p-8 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border">
                    <Gift className="h-16 w-16 mx-auto text-blue-500 mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">Total Claimable Rewards</p>
                    <p className="text-4xl font-bold mb-1">{parseFloat(stakingStats.rewards).toFixed(4)} ANDE</p>
                    <p className="text-sm text-muted-foreground">
                      ≈ ${(parseFloat(stakingStats.rewards) * 2.30).toFixed(2)} USD
                    </p>
                  </div>

                  <Button
                    onClick={handleClaimRewards}
                    disabled={isClaiming || parseFloat(stakingStats.rewards) === 0}
                    className="w-full"
                    size="lg"
                  >
                    {isClaiming ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Claiming...
                      </>
                    ) : (
                      <>
                        <Gift className="mr-2 h-5 w-5" />
                        Claim Rewards
                      </>
                    )}
                  </Button>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>About Rewards</AlertTitle>
                    <AlertDescription>
                      Rewards are calculated based on your staked amount and the current APR.
                      You can claim your rewards at any time without affecting your staked balance.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}