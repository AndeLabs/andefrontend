'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { useAndeBalance } from '@/hooks/use-ande-balance';
import { useGasCheck } from '@/hooks/use-gas-check';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useStaking, StakingLevel, LockPeriod } from '@/hooks/use-staking';
import { andechain } from '@/lib/chains';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Shield,
  Users,
  Info,
  ExternalLink,
  Copy,
  RefreshCw,
} from 'lucide-react';

export default function StakingPage() {
  const { address, isConnected } = useAccount();
  const { balance } = useAndeBalance();
  const { getGasErrorMessage, hasEnoughGas, formattedNativeBalance } = useGasCheck();
  const { toast } = useToast();

  // Staking hook
  const {
    stakeInfo,
    poolStats,
    liquidityAPY,
    governanceAPY,
    sequencerAPY,
    minLiquidityStake,
    minGovernanceStake,
    minSequencerStake,
    pendingRewards,
    allowance,
    needsApproval,
    approve,
    stakeLiquidity,
    stakeGovernance,
    stakeSequencer,
    unstake,
    claimRewards,
    refreshData,
    isApproving,
    isStaking,
    isUnstaking,
    isClaiming,
    isConfirming,
    approveSuccess,
    liquiditySuccess,
    governanceSuccess,
    sequencerSuccess,
    unstakeSuccess,
    claimSuccess,
    LOCK_PERIOD_NAMES,
  } = useStaking();

  // Form state
  const [liquidityAmount, setLiquidityAmount] = useState('');
  const [governanceAmount, setGovernanceAmount] = useState('');
  const [selectedLockPeriod, setSelectedLockPeriod] = useState<LockPeriod>(LockPeriod.TWELVE_MONTHS);
  const [sequencerAmount, setSequencerAmount] = useState('');

  // Handle approve actions
  const handleApproveLiquidity = async () => {
    // Check gas first
    const gasError = getGasErrorMessage();
    if (gasError) {
      toast({
        title: '⚠️ Insufficient Gas',
        description: gasError,
        variant: 'destructive',
      });
      return;
    }

    try {
      await approve(liquidityAmount);
      toast({
        title: '🔐 Approval Submitted',
        description: 'Token approval transaction has been submitted',
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to approve tokens';
      console.error('Approval error:', error);
      toast({
        title: '❌ Approval Failed',
        description: errorMsg.includes('user rejected') 
          ? 'Transaction was rejected' 
          : errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleApproveGovernance = async () => {
    // Check gas first
    const gasError = getGasErrorMessage();
    if (gasError) {
      toast({
        title: '⚠️ Insufficient Gas',
        description: gasError,
        variant: 'destructive',
      });
      return;
    }

    try {
      await approve(governanceAmount);
      toast({
        title: '🔐 Approval Submitted',
        description: 'Token approval transaction has been submitted',
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to approve tokens';
      console.error('Approval error:', error);
      toast({
        title: '❌ Approval Failed',
        description: errorMsg.includes('user rejected') 
          ? 'Transaction was rejected' 
          : errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleApproveSequencer = async () => {
    // Check gas first
    const gasError = getGasErrorMessage();
    if (gasError) {
      toast({
        title: '⚠️ Insufficient Gas',
        description: gasError,
        variant: 'destructive',
      });
      return;
    }

    try {
      await approve(sequencerAmount);
      toast({
        title: '🔐 Approval Submitted',
        description: 'Token approval transaction has been submitted',
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to approve tokens';
      console.error('Approval error:', error);
      toast({
        title: '❌ Approval Failed',
        description: errorMsg.includes('user rejected') 
          ? 'Transaction was rejected' 
          : errorMsg,
        variant: 'destructive',
      });
    }
  };

  // Handle stake actions
  const handleStakeLiquidity = async () => {
    // Check gas first
    const gasError = getGasErrorMessage();
    if (gasError) {
      toast({
        title: '⚠️ Insufficient Gas',
        description: gasError,
        variant: 'destructive',
      });
      return;
    }

    try {
      await stakeLiquidity(liquidityAmount);
      toast({
        title: '🚀 Liquidity Staking Submitted',
        description: 'Your liquidity staking transaction has been submitted',
      });
      setLiquidityAmount('');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to stake';
      console.error('Staking error:', error);
      toast({
        title: '❌ Staking Failed',
        description: errorMsg.includes('user rejected') 
          ? 'Transaction was rejected' 
          : errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleStakeGovernance = async () => {
    // Check gas first
    const gasError = getGasErrorMessage();
    if (gasError) {
      toast({
        title: '⚠️ Insufficient Gas',
        description: gasError,
        variant: 'destructive',
      });
      return;
    }

    try {
      await stakeGovernance(governanceAmount, selectedLockPeriod);
      toast({
        title: '🚀 Governance Staking Submitted',
        description: `Staking with ${LOCK_PERIOD_NAMES[selectedLockPeriod]} lock period`,
      });
      setGovernanceAmount('');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to stake';
      console.error('Staking error:', error);
      toast({
        title: '❌ Staking Failed',
        description: errorMsg.includes('user rejected') 
          ? 'Transaction was rejected' 
          : errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleStakeSequencer = async () => {
    // Check gas first
    const gasError = getGasErrorMessage();
    if (gasError) {
      toast({
        title: '⚠️ Insufficient Gas',
        description: gasError,
        variant: 'destructive',
      });
      return;
    }

    try {
      await stakeSequencer(sequencerAmount);
      toast({
        title: '🚀 Sequencer Staking Submitted',
        description: 'Your sequencer staking transaction has been submitted',
      });
      setSequencerAmount('');
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to stake';
      console.error('Staking error:', error);
      toast({
        title: '❌ Staking Failed',
        description: errorMsg.includes('user rejected') 
          ? 'Transaction was rejected' 
          : errorMsg,
        variant: 'destructive',
      });
    }
  };

  const handleUnstake = async () => {
    try {
      await unstake();
      toast({
        title: '🔓 Unstake Transaction Submitted',
        description: 'Your unstake transaction has been submitted',
      });
    } catch (error: any) {
      toast({
        title: '❌ Unstake Failed',
        description: error.message || 'Failed to unstake',
        variant: 'destructive',
      });
    }
  };

  const handleClaim = async () => {
    try {
      await claimRewards();
      toast({
        title: '🎁 Claim Transaction Submitted',
        description: 'Your rewards claim has been submitted',
      });
    } catch (error: any) {
      toast({
        title: '❌ Claim Failed',
        description: error.message || 'Failed to claim rewards',
        variant: 'destructive',
      });
    }
  };

  const handleCopyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: 'Copied!',
        description: 'Address copied to clipboard',
      });
    }
  };

  const explorerUrl = andechain.blockExplorers?.default?.url;

  if (!isConnected) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Staking</h1>
          <p className="text-muted-foreground mt-2">
            Stake ANDE and earn rewards
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Wallet Not Connected</AlertTitle>
          <AlertDescription>
            Please connect your wallet to access staking features.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Staking</h1>
        <p className="text-muted-foreground mt-2">
          Stake ANDE and earn rewards on {andechain.name}
        </p>
      </div>

      {/* Gas Warning */}
      {!hasEnoughGas && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Insufficient Gas</AlertTitle>
          <AlertDescription>
            {getGasErrorMessage()}
            {' '}
            <a 
              href="/faucet" 
              className="underline font-medium hover:text-foreground"
            >
              Get ANDE from the faucet
            </a>
            {' '}to pay for transaction fees.
            <div className="mt-2 text-xs">
              Native balance for gas: {formattedNativeBalance} ANDE
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Success Messages */}
      {approveSuccess && (
        <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
          <CheckCircle2 className="h-4 w-4 text-blue-500" />
          <AlertTitle className="text-blue-800 dark:text-blue-400">Approval Successful!</AlertTitle>
          <AlertDescription className="text-blue-600 dark:text-blue-500">
            ANDE approved successfully. You can now stake.
          </AlertDescription>
        </Alert>
      )}

      {(liquiditySuccess || governanceSuccess || sequencerSuccess) && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Stake Successful!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            Your tokens have been staked successfully. Rewards will start accumulating immediately.
          </AlertDescription>
        </Alert>
      )}

      {unstakeSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Unstake Successful!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            Your tokens have been unstaked and returned to your wallet.
          </AlertDescription>
        </Alert>
      )}

      {claimSuccess && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle className="text-green-700 dark:text-green-400">Rewards Claimed!</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-500">
            Your staking rewards have been claimed successfully.
          </AlertDescription>
        </Alert>
      )}

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Staked</CardTitle>
            <Landmark className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stakeInfo ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{parseFloat(stakeInfo.amountFormatted).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">ANDE</p>
                <Badge variant="outline" className="text-xs">{stakeInfo.levelName}</Badge>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">0.00</div>
                <p className="text-xs text-muted-foreground">ANDE</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Rewards</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="text-2xl font-bold">{parseFloat(pendingRewards).toFixed(4)}</div>
              <p className="text-xs text-muted-foreground">ANDE</p>
              {parseFloat(pendingRewards) > 0 && (
                <Button
                  size="sm"
                  onClick={handleClaim}
                  disabled={isClaiming || isConfirming}
                  className="mt-2 w-full"
                >
                  {isClaiming || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Claiming...
                    </>
                  ) : (
                    <>
                      <Gift className="mr-2 h-3 w-3" />
                      Claim
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Staked</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {poolStats ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">
                  {parseFloat(poolStats.totalStaked).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">ANDE Total</p>
                <p className="text-xs text-muted-foreground">{poolStats.totalStakers} Stakers</p>
              </div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voting Power</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stakeInfo ? (
              <div className="space-y-1">
                <div className="text-2xl font-bold">{parseFloat(stakeInfo.votingPower).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Governance Weight</p>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-2xl font-bold">0.00</div>
                <p className="text-xs text-muted-foreground">No stake</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* My Position Card */}
      {stakeInfo && parseFloat(stakeInfo.amountFormatted) > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>My Staking Position</CardTitle>
                <CardDescription>Your current stake details and status</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={refreshData}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Landmark className="h-4 w-4" />
                  Staked Amount
                </div>
                <div className="text-2xl font-bold">{parseFloat(stakeInfo.amountFormatted).toFixed(4)} ANDE</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  Current APY
                </div>
                <div className="text-2xl font-bold text-green-600">{stakeInfo.apy}%</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Lock Status
                </div>
                {stakeInfo.isLocked ? (
                  <div>
                    <Badge variant="secondary" className="mb-1">
                      <Lock className="h-3 w-3 mr-1" />
                      Locked
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      Unlocks in {stakeInfo.daysUntilUnlock} days
                    </p>
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-green-50">
                    <Unlock className="h-3 w-3 mr-1" />
                    Unlocked
                  </Badge>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  Staking Level
                </div>
                <Badge>{stakeInfo.levelName}</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Lock Period
                </div>
                <div className="text-sm font-medium">{stakeInfo.lockPeriodName}</div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4" />
                  Voting Power
                </div>
                <div className="text-sm font-medium">{parseFloat(stakeInfo.votingPower).toFixed(2)}</div>
              </div>
            </div>

            {stakeInfo.canUnstake && (
              <div className="mt-6">
                <Button
                  variant="outline"
                  onClick={handleUnstake}
                  disabled={isUnstaking || isConfirming}
                  className="w-full md:w-auto"
                >
                  {isUnstaking || isConfirming ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Unstaking...
                    </>
                  ) : (
                    <>
                      <Unlock className="mr-2 h-4 w-4" />
                      Unstake All
                    </>
                  )}
                </Button>
              </div>
            )}

            {stakeInfo.isLocked && (
              <Alert className="mt-6">
                <Info className="h-4 w-4" />
                <AlertTitle>Locked Period Active</AlertTitle>
                <AlertDescription>
                  Your tokens are locked until {new Date(stakeInfo.lockUntil * 1000).toLocaleDateString()}.
                  You can unstake after the lock period ends.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Staking Options */}
      <Tabs defaultValue="liquidity" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="liquidity">
            <Zap className="h-4 w-4 mr-2" />
            Liquidity
          </TabsTrigger>
          <TabsTrigger value="governance">
            <Shield className="h-4 w-4 mr-2" />
            Governance
          </TabsTrigger>
          <TabsTrigger value="sequencer">
            <Trophy className="h-4 w-4 mr-2" />
            Sequencer
          </TabsTrigger>
        </TabsList>

        {/* Liquidity Staking */}
        <TabsContent value="liquidity" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Liquidity Staking</CardTitle>
                  <CardDescription>
                    Flexible staking with no lock period. Lower APY but instant unstaking.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="liquidity-amount">Amount to Stake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="liquidity-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.0"
                        value={liquidityAmount}
                        onChange={(e) => setLiquidityAmount(e.target.value)}
                        disabled={isStaking || isConfirming}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => balance && setLiquidityAmount(balance.formatted)}
                        disabled={isStaking || isConfirming}
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum: {minLiquidityStake} ANDE • Available: {balance ? parseFloat(balance.formatted).toFixed(4) : '0'} ANDE
                    </p>
                  </div>

                  {needsApproval(liquidityAmount) ? (
                    <Button
                      onClick={handleApproveLiquidity}
                      disabled={
                        isApproving ||
                        isConfirming ||
                        !liquidityAmount ||
                        parseFloat(liquidityAmount) <= 0
                      }
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      {isApproving || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Approve ANDE
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStakeLiquidity}
                      disabled={
                        isStaking ||
                        isConfirming ||
                        !liquidityAmount ||
                        parseFloat(liquidityAmount) < parseFloat(minLiquidityStake)
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isStaking || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Staking...
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-5 w-5" />
                          Stake ANDE
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">APY</span>
                    <span className="font-semibold text-green-600">{liquidityAPY}%</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Lock Period</span>
                    <Badge variant="outline">None</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Minimum Stake</span>
                    <span className="font-mono">{minLiquidityStake} ANDE</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pool Share</span>
                    <span className="font-semibold">30%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 dark:bg-blue-950">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>✓ No lock period</p>
                  <p>✓ Instant unstaking</p>
                  <p>✓ Earn passive rewards</p>
                  <p>✓ Flexible liquidity</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Governance Staking */}
        <TabsContent value="governance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Governance Staking</CardTitle>
                  <CardDescription>
                    Lock tokens to gain voting power. Higher APY with longer lock periods.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="governance-amount">Amount to Stake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="governance-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.0"
                        value={governanceAmount}
                        onChange={(e) => setGovernanceAmount(e.target.value)}
                        disabled={isStaking || isConfirming}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => balance && setGovernanceAmount(balance.formatted)}
                        disabled={isStaking || isConfirming}
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum: {minGovernanceStake} ANDE • Available: {balance ? parseFloat(balance.formatted).toFixed(4) : '0'} ANDE
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lock-period">Lock Period</Label>
                    <Select
                      value={selectedLockPeriod.toString()}
                      onValueChange={(value) => setSelectedLockPeriod(parseInt(value) as LockPeriod)}
                    >
                      <SelectTrigger id="lock-period">
                        <SelectValue placeholder="Select lock period" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={LockPeriod.THREE_MONTHS.toString()}>
                          3 Months (1.5x voting power)
                        </SelectItem>
                        <SelectItem value={LockPeriod.SIX_MONTHS.toString()}>
                          6 Months (2x voting power)
                        </SelectItem>
                        <SelectItem value={LockPeriod.TWELVE_MONTHS.toString()}>
                          12 Months (3x voting power)
                        </SelectItem>
                        <SelectItem value={LockPeriod.TWENTY_FOUR_MONTHS.toString()}>
                          24 Months (4x voting power)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Longer lock periods provide more voting power
                    </p>
                  </div>

                  {needsApproval(governanceAmount) ? (
                    <Button
                      onClick={handleApproveGovernance}
                      disabled={
                        isApproving ||
                        isConfirming ||
                        !governanceAmount ||
                        parseFloat(governanceAmount) <= 0
                      }
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      {isApproving || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Approve ANDE
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStakeGovernance}
                      disabled={
                        isStaking ||
                        isConfirming ||
                        !governanceAmount ||
                        parseFloat(governanceAmount) < parseFloat(minGovernanceStake)
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isStaking || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Staking...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          Stake for Governance
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">APY</span>
                    <span className="font-semibold text-green-600">{governanceAPY}%</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Selected Lock</span>
                    <Badge>{LOCK_PERIOD_NAMES[selectedLockPeriod]}</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Minimum Stake</span>
                    <span className="font-mono">{minGovernanceStake} ANDE</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pool Share</span>
                    <span className="font-semibold">30%</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-purple-50 dark:bg-purple-950">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>✓ Higher APY rewards</p>
                  <p>✓ Enhanced voting power</p>
                  <p>✓ Governance participation</p>
                  <p>✓ Protocol influence</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Sequencer Staking */}
        <TabsContent value="sequencer" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Sequencer Staking</CardTitle>
                  <CardDescription>
                    Stake to become a sequencer and validate blocks. Highest APY and network rewards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertTitle>High Responsibility</AlertTitle>
                    <AlertDescription>
                      Sequencer staking requires significant commitment and technical knowledge.
                      Ensure you understand the responsibilities before staking.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="sequencer-amount">Amount to Stake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="sequencer-amount"
                        type="number"
                        step="0.01"
                        placeholder="0.0"
                        value={sequencerAmount}
                        onChange={(e) => setSequencerAmount(e.target.value)}
                        disabled={isStaking || isConfirming}
                        className="font-mono"
                      />
                      <Button
                        variant="outline"
                        onClick={() => balance && setSequencerAmount(balance.formatted)}
                        disabled={isStaking || isConfirming}
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Minimum: {minSequencerStake} ANDE • Available: {balance ? parseFloat(balance.formatted).toFixed(4) : '0'} ANDE
                    </p>
                  </div>

                  {needsApproval(sequencerAmount) ? (
                    <Button
                      onClick={handleApproveSequencer}
                      disabled={
                        isApproving ||
                        isConfirming ||
                        !sequencerAmount ||
                        parseFloat(sequencerAmount) <= 0
                      }
                      className="w-full"
                      size="lg"
                      variant="outline"
                    >
                      {isApproving || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Approving...
                        </>
                      ) : (
                        <>
                          <Lock className="mr-2 h-5 w-5" />
                          Approve ANDE
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleStakeSequencer}
                      disabled={
                        isStaking ||
                        isConfirming ||
                        !sequencerAmount ||
                        parseFloat(sequencerAmount) < parseFloat(minSequencerStake)
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isStaking || isConfirming ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Staking...
                        </>
                      ) : (
                        <>
                          <Trophy className="mr-2 h-5 w-5" />
                          Stake as Sequencer
                        </>
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">APY</span>
                    <span className="font-semibold text-green-600">{sequencerAPY}%</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Minimum Stake</span>
                    <span className="font-mono">{minSequencerStake} ANDE</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Pool Share</span>
                    <span className="font-semibold">40%</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Role</span>
                    <Badge variant="default">Validator</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-amber-50 dark:bg-amber-950">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <p>✓ High stake requirement</p>
                  <p>✓ Technical infrastructure</p>
                  <p>✓ Network validation duties</p>
                  <p>✓ Highest APY rewards</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}