'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useBlockNumber, useBalance } from 'wagmi';
import { parseEther, formatEther, type Address } from 'viem';
import { andechain } from '@/lib/chains';
import { ANDE_NATIVE_STAKING_ADDRESS, ANDE_TOKEN_ADDRESS } from '@/contracts/addresses';

// ABI mínimo para ERC20 (approve y allowance)
const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    type: 'function',
    name: 'allowance',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

// ABI mínimo para el contrato de staking
const STAKING_ABI = [
  {
    type: 'function',
    name: 'stakeLiquidity',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'stakeGovernance',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'lockPeriod', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    type: 'function',
    name: 'stakeSequencer',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'amount', type: 'uint256' }],
    outputs: [],
  },
  {
    type: 'function',
    name: 'unstake',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'claimRewards',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    type: 'function',
    name: 'getStakeInfo',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'amount', type: 'uint256' },
          { name: 'level', type: 'uint8' },
          { name: 'lockPeriod', type: 'uint8' },
          { name: 'lockUntil', type: 'uint256' },
          { name: 'votingPower', type: 'uint256' },
          { name: 'rewardDebt', type: 'uint256' },
          { name: 'stakedAt', type: 'uint256' },
          { name: 'isSequencer', type: 'bool' },
          { name: 'lastStakeBlock', type: 'uint256' },
          { name: 'lastStakeTimestamp', type: 'uint256' },
        ],
      },
    ],
  },
  {
    type: 'function',
    name: 'pendingRewards',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getTotalStaked',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'getPoolStats',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalStaked', type: 'uint256' },
      { name: 'liquidityStaked', type: 'uint256' },
      { name: 'governanceStaked', type: 'uint256' },
      { name: 'sequencerStaked', type: 'uint256' },
      { name: 'totalStakers', type: 'uint256' },
    ],
  },
  {
    type: 'function',
    name: 'getAPY',
    stateMutability: 'view',
    inputs: [{ name: 'level', type: 'uint8' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'MIN_LIQUIDITY_STAKE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'MIN_GOVERNANCE_STAKE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'function',
    name: 'MIN_SEQUENCER_STAKE',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }],
  },
  {
    type: 'event',
    name: 'Staked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
      { name: 'level', type: 'uint8', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'Unstaked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'RewardsClaimed',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export enum StakingLevel {
  LIQUIDITY = 0,
  GOVERNANCE = 1,
  SEQUENCER = 2,
}

export enum LockPeriod {
  NONE = 0,
  THREE_MONTHS = 1,
  SIX_MONTHS = 2,
  TWELVE_MONTHS = 3,
  TWENTY_FOUR_MONTHS = 4,
}

export interface StakeInfo {
  amount: bigint;
  level: StakingLevel;
  lockPeriod: LockPeriod;
  lockUntil: bigint;
  votingPower: bigint;
  rewardDebt: bigint;
  stakedAt: bigint;
  isSequencer: boolean;
  lastStakeBlock: bigint;
  lastStakeTimestamp: bigint;
}

export interface PoolStats {
  totalStaked: bigint;
  liquidityStaked: bigint;
  governanceStaked: bigint;
  sequencerStaked: bigint;
  totalStakers: bigint;
}

export interface FormattedStakeInfo {
  amount: string;
  amountFormatted: string;
  level: StakingLevel;
  levelName: string;
  lockPeriod: LockPeriod;
  lockPeriodName: string;
  lockUntil: number;
  votingPower: string;
  rewards: string;
  stakedAt: number;
  isSequencer: boolean;
  isLocked: boolean;
  canUnstake: boolean;
  daysUntilUnlock: number;
  apy: string;
}

const LOCK_PERIOD_NAMES: Record<LockPeriod, string> = {
  [LockPeriod.NONE]: 'No Lock',
  [LockPeriod.THREE_MONTHS]: '3 Months',
  [LockPeriod.SIX_MONTHS]: '6 Months',
  [LockPeriod.TWELVE_MONTHS]: '12 Months',
  [LockPeriod.TWENTY_FOUR_MONTHS]: '24 Months',
};

const LEVEL_NAMES: Record<StakingLevel, string> = {
  [StakingLevel.LIQUIDITY]: 'Liquidity Staking',
  [StakingLevel.GOVERNANCE]: 'Governance Staking',
  [StakingLevel.SEQUENCER]: 'Sequencer Staking',
};

export function useStaking() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: andechain.id });
  const { data: currentBlock } = useBlockNumber({ 
    watch: true, 
    chainId: andechain.id 
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Contract reads
  const { data: stakeInfo, refetch: refetchStakeInfo } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getStakeInfo',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const { data: pendingRewards, refetch: refetchRewards } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'pendingRewards',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  const { data: poolStats, refetch: refetchPoolStats } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getPoolStats',
    query: {
      enabled: true,
    },
  });

  const { data: liquidityAPY } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getAPY',
    args: [StakingLevel.LIQUIDITY],
  });

  const { data: governanceAPY } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getAPY',
    args: [StakingLevel.GOVERNANCE],
  });

  const { data: sequencerAPY } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'getAPY',
    args: [StakingLevel.SEQUENCER],
  });

  const { data: minLiquidityStake } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'MIN_LIQUIDITY_STAKE',
  });

  const { data: minGovernanceStake } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'MIN_GOVERNANCE_STAKE',
  });

  const { data: minSequencerStake } = useReadContract({
    address: ANDE_NATIVE_STAKING_ADDRESS,
    abi: STAKING_ABI,
    functionName: 'MIN_SEQUENCER_STAKE',
  });

  // Check token balance
  const { data: tokenBalance } = useReadContract({
    address: ANDE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Check allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: ANDE_TOKEN_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, ANDE_NATIVE_STAKING_ADDRESS] : undefined,
    query: {
      enabled: !!address && isConnected,
    },
  });

  // Contract writes - Approve
  const { 
    writeContract: approveWrite, 
    data: approveHash,
    isPending: isApproving,
  } = useWriteContract();

  const { isLoading: isConfirmingApprove, isSuccess: approveSuccess } = 
    useWaitForTransactionReceipt({ hash: approveHash });

  // Contract writes - Staking
  const { 
    writeContract: stakeLiquidity, 
    data: liquidityHash,
    isPending: isStakingLiquidity,
  } = useWriteContract();

  const { 
    writeContract: stakeGovernance, 
    data: governanceHash,
    isPending: isStakingGovernance,
  } = useWriteContract();

  const { 
    writeContract: stakeSequencer, 
    data: sequencerHash,
    isPending: isStakingSequencer,
  } = useWriteContract();

  const { 
    writeContract: unstakeWrite, 
    data: unstakeHash,
    isPending: isUnstaking,
  } = useWriteContract();

  const { 
    writeContract: claimWrite, 
    data: claimHash,
    isPending: isClaiming,
  } = useWriteContract();

  // Transaction receipts
  const { isLoading: isConfirmingLiquidity, isSuccess: liquiditySuccess } = 
    useWaitForTransactionReceipt({ hash: liquidityHash });

  const { isLoading: isConfirmingGovernance, isSuccess: governanceSuccess } = 
    useWaitForTransactionReceipt({ hash: governanceHash });

  const { isLoading: isConfirmingSequencer, isSuccess: sequencerSuccess } = 
    useWaitForTransactionReceipt({ hash: sequencerHash });

  const { isLoading: isConfirmingUnstake, isSuccess: unstakeSuccess } = 
    useWaitForTransactionReceipt({ hash: unstakeHash });

  const { isLoading: isConfirmingClaim, isSuccess: claimSuccess } = 
    useWaitForTransactionReceipt({ hash: claimHash });

  // Format stake info
  const formattedStakeInfo = useMemo((): FormattedStakeInfo | null => {
    if (!stakeInfo || !address) return null;

    const info = stakeInfo as unknown as StakeInfo;
    const now = Math.floor(Date.now() / 1000);
    const lockUntilSeconds = Number(info.lockUntil);
    const isLocked = lockUntilSeconds > now;
    const daysUntilUnlock = isLocked 
      ? Math.ceil((lockUntilSeconds - now) / 86400)
      : 0;

    // Get APY based on level
    let apy = '0';
    if (info.level === StakingLevel.LIQUIDITY && liquidityAPY) {
      apy = (Number(liquidityAPY) / 100).toFixed(2);
    } else if (info.level === StakingLevel.GOVERNANCE && governanceAPY) {
      apy = (Number(governanceAPY) / 100).toFixed(2);
    } else if (info.level === StakingLevel.SEQUENCER && sequencerAPY) {
      apy = (Number(sequencerAPY) / 100).toFixed(2);
    }

    return {
      amount: info.amount.toString(),
      amountFormatted: formatEther(info.amount),
      level: info.level,
      levelName: LEVEL_NAMES[info.level],
      lockPeriod: info.lockPeriod,
      lockPeriodName: LOCK_PERIOD_NAMES[info.lockPeriod],
      lockUntil: lockUntilSeconds,
      votingPower: formatEther(info.votingPower),
      rewards: pendingRewards ? formatEther(pendingRewards as bigint) : '0',
      stakedAt: Number(info.stakedAt),
      isSequencer: info.isSequencer,
      isLocked,
      canUnstake: !isLocked && info.amount > BigInt(0),
      daysUntilUnlock,
      apy,
    };
  }, [stakeInfo, address, pendingRewards, liquidityAPY, governanceAPY, sequencerAPY]);

  // Format pool stats
  const formattedPoolStats = useMemo(() => {
    if (!poolStats) return null;

    const stats = poolStats as unknown as PoolStats;
    return {
      totalStaked: formatEther(stats.totalStaked),
      liquidityStaked: formatEther(stats.liquidityStaked),
      governanceStaked: formatEther(stats.governanceStaked),
      sequencerStaked: formatEther(stats.sequencerStaked),
      totalStakers: stats.totalStakers.toString(),
    };
  }, [poolStats]);

  // Approve function
  const handleApprove = useCallback(async (amount: string) => {
    const amountWei = parseEther(amount);
    
    try {
      approveWrite({
        address: ANDE_TOKEN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [ANDE_NATIVE_STAKING_ADDRESS, amountWei],
      });
    } catch (error: any) {
      console.error('Approve transaction error:', error);
      throw new Error(error?.message || 'Failed to submit approve transaction');
    }
  }, [approveWrite]);

  // Check if approval is needed
  const needsApproval = useCallback((amount: string): boolean => {
    if (!allowance || !amount || parseFloat(amount) <= 0) return true;
    const amountWei = parseEther(amount);
    return (allowance as bigint) < amountWei;
  }, [allowance]);

  // Stake functions
  const handleStakeLiquidity = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }

    const amountWei = parseEther(amount);
    
    if (minLiquidityStake && amountWei < (minLiquidityStake as bigint)) {
      throw new Error(`Minimum stake is ${formatEther(minLiquidityStake as bigint)} ANDE`);
    }

    // Check token balance
    const currentBalance = (tokenBalance as bigint) || BigInt(0);
    if (currentBalance < amountWei) {
      throw new Error(`Insufficient ANDE balance. You have ${formatEther(currentBalance)} ANDE but need ${amount} ANDE`);
    }

    // Check if approval is needed - critical check
    const currentAllowance = (allowance as bigint) || BigInt(0);
    if (currentAllowance < amountWei) {
      throw new Error(`Insufficient approval. Please approve ${amount} ANDE tokens first. Current allowance: ${formatEther(currentAllowance)} ANDE`);
    }
    
    console.log('Staking liquidity:', {
      amount: amount,
      amountWei: amountWei.toString(),
      balance: formatEther(currentBalance),
      allowance: formatEther(currentAllowance),
    });

    try {
      stakeLiquidity({
        address: ANDE_NATIVE_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stakeLiquidity',
        args: [amountWei],
      });
    } catch (error: any) {
      console.error('Stake liquidity transaction error:', error);
      const errorMessage = error?.message || '';
      if (errorMessage.includes('insufficient allowance') || errorMessage.includes('ERC20: insufficient allowance')) {
        throw new Error('Token approval is insufficient. Please approve tokens first.');
      }
      throw new Error(errorMessage || 'Failed to submit stake transaction');
    }
  }, [stakeLiquidity, minLiquidityStake, allowance, tokenBalance]);

  const handleStakeGovernance = useCallback(async (amount: string, lockPeriod: LockPeriod) => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }

    if (lockPeriod === LockPeriod.NONE) {
      throw new Error('Governance staking requires a lock period');
    }

    const amountWei = parseEther(amount);
    
    if (minGovernanceStake && amountWei < (minGovernanceStake as bigint)) {
      throw new Error(`Minimum stake is ${formatEther(minGovernanceStake as bigint)} ANDE`);
    }

    // Check token balance
    const currentBalance = (tokenBalance as bigint) || BigInt(0);
    if (currentBalance < amountWei) {
      throw new Error(`Insufficient ANDE balance. You have ${formatEther(currentBalance)} ANDE but need ${amount} ANDE`);
    }

    // Check if approval is needed - critical check
    const currentAllowance = (allowance as bigint) || BigInt(0);
    if (currentAllowance < amountWei) {
      throw new Error(`Insufficient approval. Please approve ${amount} ANDE tokens first. Current allowance: ${formatEther(currentAllowance)} ANDE`);
    }
    
    console.log('Staking governance:', {
      amount: amount,
      amountWei: amountWei.toString(),
      lockPeriod: lockPeriod,
      balance: formatEther(currentBalance),
      allowance: formatEther(currentAllowance),
    });

    try {
      stakeGovernance({
        address: ANDE_NATIVE_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stakeGovernance',
        args: [amountWei, lockPeriod],
      });
    } catch (error: any) {
      console.error('Stake governance transaction error:', error);
      const errorMessage = error?.message || '';
      if (errorMessage.includes('insufficient allowance') || errorMessage.includes('ERC20: insufficient allowance')) {
        throw new Error('Token approval is insufficient. Please approve tokens first.');
      }
      throw new Error(errorMessage || 'Failed to submit stake transaction');
    }
  }, [stakeGovernance, minGovernanceStake, allowance, tokenBalance]);

  const handleStakeSequencer = useCallback(async (amount: string) => {
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error('Invalid amount');
    }

    const amountWei = parseEther(amount);
    
    if (minSequencerStake && amountWei < (minSequencerStake as bigint)) {
      throw new Error(`Minimum stake is ${formatEther(minSequencerStake as bigint)} ANDE`);
    }

    // Check token balance
    const currentBalance = (tokenBalance as bigint) || BigInt(0);
    if (currentBalance < amountWei) {
      throw new Error(`Insufficient ANDE balance. You have ${formatEther(currentBalance)} ANDE but need ${amount} ANDE`);
    }

    // Check if approval is needed - critical check
    const currentAllowance = (allowance as bigint) || BigInt(0);
    if (currentAllowance < amountWei) {
      throw new Error(`Insufficient approval. Please approve ${amount} ANDE tokens first. Current allowance: ${formatEther(currentAllowance)} ANDE`);
    }
    
    console.log('Staking sequencer:', {
      amount: amount,
      amountWei: amountWei.toString(),
      balance: formatEther(currentBalance),
      allowance: formatEther(currentAllowance),
    });

    try {
      stakeSequencer({
        address: ANDE_NATIVE_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'stakeSequencer',
        args: [amountWei],
      });
    } catch (error: any) {
      console.error('Stake sequencer transaction error:', error);
      const errorMessage = error?.message || '';
      if (errorMessage.includes('insufficient allowance') || errorMessage.includes('ERC20: insufficient allowance')) {
        throw new Error('Token approval is insufficient. Please approve tokens first.');
      }
      throw new Error(errorMessage || 'Failed to submit stake transaction');
    }
  }, [stakeSequencer, minSequencerStake, allowance, tokenBalance]);

  const handleUnstake = useCallback(async () => {
    if (!formattedStakeInfo?.canUnstake) {
      throw new Error('Cannot unstake at this time');
    }

    try {
      unstakeWrite({
        address: ANDE_NATIVE_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'unstake',
      });
    } catch (error: any) {
      console.error('Unstake transaction error:', error);
      throw new Error(error?.message || 'Failed to submit unstake transaction');
    }
  }, [unstakeWrite, formattedStakeInfo]);

  const handleClaimRewards = useCallback(async () => {
    if (!pendingRewards || (pendingRewards as bigint) === BigInt(0)) {
      throw new Error('No rewards to claim');
    }

    try {
      claimWrite({
        address: ANDE_NATIVE_STAKING_ADDRESS,
        abi: STAKING_ABI,
        functionName: 'claimRewards',
      });
    } catch (error: any) {
      console.error('Claim rewards transaction error:', error);
      throw new Error(error?.message || 'Failed to submit claim transaction');
    }
  }, [claimWrite, pendingRewards]);

  // Refresh all data
  const refreshData = useCallback(async () => {
    await Promise.all([
      refetchStakeInfo(),
      refetchRewards(),
      refetchPoolStats(),
    ]);
  }, [refetchStakeInfo, refetchRewards, refetchPoolStats]);

  // Auto-refresh on successful transactions
  useEffect(() => {
    if (liquiditySuccess || governanceSuccess || sequencerSuccess || unstakeSuccess || claimSuccess) {
      refreshData();
    }
  }, [liquiditySuccess, governanceSuccess, sequencerSuccess, unstakeSuccess, claimSuccess, refreshData]);

  // Auto-refresh allowance after approval
  useEffect(() => {
    if (approveSuccess) {
      refetchAllowance();
    }
  }, [approveSuccess, refetchAllowance]);

  // Auto-refresh on new blocks
  useEffect(() => {
    if (currentBlock) {
      refetchRewards();
    }
  }, [currentBlock, refetchRewards]);

  return {
    // State
    isConnected,
    address,
    isLoading,
    error,

    // Stake info
    stakeInfo: formattedStakeInfo,
    poolStats: formattedPoolStats,

    // APYs
    liquidityAPY: liquidityAPY ? (Number(liquidityAPY) / 100).toFixed(2) : '0',
    governanceAPY: governanceAPY ? (Number(governanceAPY) / 100).toFixed(2) : '0',
    sequencerAPY: sequencerAPY ? (Number(sequencerAPY) / 100).toFixed(2) : '0',

    // Minimum stakes
    minLiquidityStake: minLiquidityStake ? formatEther(minLiquidityStake as bigint) : '0',
    minGovernanceStake: minGovernanceStake ? formatEther(minGovernanceStake as bigint) : '0',
    minSequencerStake: minSequencerStake ? formatEther(minSequencerStake as bigint) : '0',

    // Pending rewards
    pendingRewards: pendingRewards ? formatEther(pendingRewards as bigint) : '0',

    // Allowance
    allowance: allowance ? formatEther(allowance as bigint) : '0',
    needsApproval,

    // Actions
    approve: handleApprove,
    stakeLiquidity: handleStakeLiquidity,
    stakeGovernance: handleStakeGovernance,
    stakeSequencer: handleStakeSequencer,
    unstake: handleUnstake,
    claimRewards: handleClaimRewards,
    refreshData,

    // Loading states
    isApproving,
    isStaking: isStakingLiquidity || isStakingGovernance || isStakingSequencer,
    isUnstaking,
    isClaiming,
    isConfirming: isConfirmingApprove || isConfirmingLiquidity || isConfirmingGovernance || isConfirmingSequencer || isConfirmingUnstake || isConfirmingClaim,

    // Transaction hashes
    approveHash,
    liquidityHash,
    governanceHash,
    sequencerHash,
    unstakeHash,
    claimHash,

    // Success states
    approveSuccess,
    liquiditySuccess,
    governanceSuccess,
    sequencerSuccess,
    unstakeSuccess,
    claimSuccess,

    // Enums for components
    StakingLevel,
    LockPeriod,
    LOCK_PERIOD_NAMES,
    LEVEL_NAMES,
  };
}