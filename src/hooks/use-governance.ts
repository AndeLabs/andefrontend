'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  usePublicClient,
  useBlockNumber,
} from 'wagmi';
import { parseEther, formatEther, type Address, encodeAbiParameters, keccak256, toHex } from 'viem';
import { ANDE_GOVERNOR_ADDRESS, ANDE_TOKEN_ADDRESS, ANDE_NATIVE_STAKING_ADDRESS } from '@/contracts/addresses';
import AndeGovernorABI from '@/contracts/abis/AndeGovernor.json';
import AndeTokenABI from '@/contracts/abis/ANDEToken.json';

/**
 * Proposal States
 * Matches OpenZeppelin Governor contract states
 */
export enum ProposalState {
  Pending = 0,
  Active = 1,
  Canceled = 2,
  Defeated = 3,
  Succeeded = 4,
  Queued = 5,
  Expired = 6,
  Executed = 7,
}

/**
 * Vote Types
 */
export enum VoteType {
  Against = 0,
  For = 1,
  Abstain = 2,
}

/**
 * Proposal Types (Multi-Level)
 */
export enum ProposalType {
  OPERATIONAL = 0,
  PROTOCOL = 1,
  CRITICAL = 2,
  EMERGENCY = 3,
}

export interface ProposalVotes {
  againstVotes: bigint;
  forVotes: bigint;
  abstainVotes: bigint;
}

export interface ProposalDetails {
  id: bigint;
  proposer: Address;
  targets: Address[];
  values: bigint[];
  calldatas: string[];
  description: string;
  state: ProposalState;
  votes: ProposalVotes;
  startBlock: bigint;
  endBlock: bigint;
  eta: bigint;
  descriptionHash: string;
}

export interface VotingPower {
  baseVotes: bigint;
  stakingBonus: bigint;
  totalVotes: bigint;
}

export interface GovernanceStats {
  votingDelay: bigint;
  votingPeriod: bigint;
  proposalThreshold: bigint;
  quorum: bigint;
  totalProposals: number;
  activeProposals: number;
  userVotingPower: bigint;
  userDelegatedTo: Address | null;
  isDelegate: boolean;
}

const PROPOSAL_STATE_NAMES: Record<ProposalState, string> = {
  [ProposalState.Pending]: 'Pending',
  [ProposalState.Active]: 'Active',
  [ProposalState.Canceled]: 'Canceled',
  [ProposalState.Defeated]: 'Defeated',
  [ProposalState.Succeeded]: 'Succeeded',
  [ProposalState.Queued]: 'Queued',
  [ProposalState.Expired]: 'Expired',
  [ProposalState.Executed]: 'Executed',
};

export function useGovernance() {
  const { address, isConnected } = useAccount();
  const publicClient = usePublicClient();
  const { data: blockNumber } = useBlockNumber({ watch: true });

  // Write contract hooks
  const { writeContract: propose, data: proposeHash, isPending: isProposing } = useWriteContract();
  const { writeContract: castVote, data: voteHash, isPending: isVoting } = useWriteContract();
  const { writeContract: queueProposal, data: queueHash, isPending: isQueuing } = useWriteContract();
  const { writeContract: executeProposal, data: executeHash, isPending: isExecuting } = useWriteContract();
  const { writeContract: delegateVotes, data: delegateHash, isPending: isDelegating } = useWriteContract();

  // Wait for transactions
  const { isLoading: isProposeConfirming, isSuccess: isProposeSuccess } = useWaitForTransactionReceipt({ hash: proposeHash });
  const { isLoading: isVoteConfirming, isSuccess: isVoteSuccess } = useWaitForTransactionReceipt({ hash: voteHash });
  const { isLoading: isQueueConfirming, isSuccess: isQueueSuccess } = useWaitForTransactionReceipt({ hash: queueHash });
  const { isLoading: isExecuteConfirming, isSuccess: isExecuteSuccess } = useWaitForTransactionReceipt({ hash: executeHash });
  const { isLoading: isDelegateConfirming, isSuccess: isDelegateSuccess } = useWaitForTransactionReceipt({ hash: delegateHash });

  // ============================================================================
  // READ FUNCTIONS - Governance Stats
  // ============================================================================

  const { data: votingDelay } = useReadContract({
    address: ANDE_GOVERNOR_ADDRESS,
    abi: AndeGovernorABI,
    functionName: 'votingDelay',
  });

  const { data: votingPeriod } = useReadContract({
    address: ANDE_GOVERNOR_ADDRESS,
    abi: AndeGovernorABI,
    functionName: 'votingPeriod',
  });

  const { data: proposalThreshold } = useReadContract({
    address: ANDE_GOVERNOR_ADDRESS,
    abi: AndeGovernorABI,
    functionName: 'proposalThreshold',
  });

  const { data: userVotingPower, refetch: refetchVotingPower } = useReadContract({
    address: ANDE_GOVERNOR_ADDRESS,
    abi: AndeGovernorABI,
    functionName: 'getVotes',
    args: address ? [address, blockNumber || 0n] : undefined,
    query: {
      enabled: !!address && !!blockNumber,
    },
  });

  const { data: userDelegate } = useReadContract({
    address: ANDE_TOKEN_ADDRESS,
    abi: AndeTokenABI,
    functionName: 'delegates',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { data: tokenBalance } = useReadContract({
    address: ANDE_TOKEN_ADDRESS,
    abi: AndeTokenABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Get quorum at current block
  const { data: quorum } = useReadContract({
    address: ANDE_GOVERNOR_ADDRESS,
    abi: AndeGovernorABI,
    functionName: 'quorum',
    args: blockNumber ? [blockNumber] : undefined,
    query: {
      enabled: !!blockNumber,
    },
  });

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const governanceStats: GovernanceStats = {
    votingDelay: (votingDelay as bigint) || 0n,
    votingPeriod: (votingPeriod as bigint) || 0n,
    proposalThreshold: (proposalThreshold as bigint) || 0n,
    quorum: (quorum as bigint) || 0n,
    totalProposals: 0, // TODO: Track via events
    activeProposals: 0, // TODO: Track via events
    userVotingPower: (userVotingPower as bigint) || 0n,
    userDelegatedTo: (userDelegate as Address) || null,
    isDelegate: address ? (userDelegate as Address)?.toLowerCase() === address.toLowerCase() : false,
  };

  const hasVotingPower = governanceStats.userVotingPower > 0n;
  const canCreateProposal = governanceStats.userVotingPower >= governanceStats.proposalThreshold;

  // ============================================================================
  // PROPOSAL FUNCTIONS
  // ============================================================================

  /**
   * Get proposal state
   */
  const getProposalState = useCallback(
    async (proposalId: bigint): Promise<ProposalState | null> => {
      if (!publicClient) return null;

      try {
        const state = await publicClient.readContract({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'state',
          args: [proposalId],
        });
        return state as ProposalState;
      } catch (error) {
        console.error('Error getting proposal state:', error);
        return null;
      }
    },
    [publicClient]
  );

  /**
   * Get proposal votes
   */
  const getProposalVotes = useCallback(
    async (proposalId: bigint): Promise<ProposalVotes | null> => {
      if (!publicClient) return null;

      try {
        const votes = await publicClient.readContract({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'proposalVotes',
          args: [proposalId],
        });
        const [againstVotes, forVotes, abstainVotes] = votes as [bigint, bigint, bigint];
        return { againstVotes, forVotes, abstainVotes };
      } catch (error) {
        console.error('Error getting proposal votes:', error);
        return null;
      }
    },
    [publicClient]
  );

  /**
   * Get proposal snapshot (block number when voting starts)
   */
  const getProposalSnapshot = useCallback(
    async (proposalId: bigint): Promise<bigint | null> => {
      if (!publicClient) return null;

      try {
        const snapshot = await publicClient.readContract({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'proposalSnapshot',
          args: [proposalId],
        });
        return snapshot as bigint;
      } catch (error) {
        console.error('Error getting proposal snapshot:', error);
        return null;
      }
    },
    [publicClient]
  );

  /**
   * Get proposal deadline (block number when voting ends)
   */
  const getProposalDeadline = useCallback(
    async (proposalId: bigint): Promise<bigint | null> => {
      if (!publicClient) return null;

      try {
        const deadline = await publicClient.readContract({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'proposalDeadline',
          args: [proposalId],
        });
        return deadline as bigint;
      } catch (error) {
        console.error('Error getting proposal deadline:', error);
        return null;
      }
    },
    [publicClient]
  );

  /**
   * Get proposal ETA (for queued proposals)
   */
  const getProposalEta = useCallback(
    async (proposalId: bigint): Promise<bigint | null> => {
      if (!publicClient) return null;

      try {
        const eta = await publicClient.readContract({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'proposalEta',
          args: [proposalId],
        });
        return eta as bigint;
      } catch (error) {
        console.error('Error getting proposal eta:', error);
        return null;
      }
    },
    [publicClient]
  );

  /**
   * Check if user has voted on proposal
   */
  const hasVoted = useCallback(
    async (proposalId: bigint, voter: Address): Promise<boolean> => {
      if (!publicClient) return false;

      try {
        const voted = await publicClient.readContract({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'hasVoted',
          args: [proposalId, voter],
        });
        return voted as boolean;
      } catch (error) {
        console.error('Error checking if voted:', error);
        return false;
      }
    },
    [publicClient]
  );

  /**
   * Hash proposal to get proposal ID
   */
  const hashProposal = useCallback(
    (targets: Address[], values: bigint[], calldatas: string[], descriptionHash: string): bigint => {
      const encoded = encodeAbiParameters(
        [
          { type: 'address[]', name: 'targets' },
          { type: 'uint256[]', name: 'values' },
          { type: 'bytes[]', name: 'calldatas' },
          { type: 'bytes32', name: 'descriptionHash' },
        ],
        [targets, values, calldatas as `0x${string}`[], descriptionHash as `0x${string}`]
      );
      return BigInt(keccak256(encoded));
    },
    []
  );

  // ============================================================================
  // WRITE FUNCTIONS
  // ============================================================================

  /**
   * Create a new proposal
   */
  const createProposal = useCallback(
    async (
      targets: Address[],
      values: bigint[],
      calldatas: string[],
      description: string
    ): Promise<{ success: boolean; proposalId?: bigint; error?: string }> => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      if (!canCreateProposal) {
        return {
          success: false,
          error: `Insufficient voting power. Need ${formatEther(governanceStats.proposalThreshold)} ANDE, have ${formatEther(governanceStats.userVotingPower)} ANDE`,
        };
      }

      try {
        propose({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'propose',
          args: [targets, values, calldatas, description],
        });

        // Calculate proposal ID
        const descriptionHash = keccak256(toHex(description));
        const proposalId = hashProposal(targets, values, calldatas, descriptionHash);

        return { success: true, proposalId };
      } catch (error: any) {
        console.error('Error creating proposal:', error);
        return { success: false, error: error.message || 'Failed to create proposal' };
      }
    },
    [address, canCreateProposal, governanceStats, propose, hashProposal]
  );

  /**
   * Cast vote on a proposal
   */
  const vote = useCallback(
    async (
      proposalId: bigint,
      support: VoteType,
      reason?: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      if (!hasVotingPower) {
        return { success: false, error: 'No voting power. Delegate or stake ANDE to participate.' };
      }

      // Check if already voted
      const voted = await hasVoted(proposalId, address);
      if (voted) {
        return { success: false, error: 'Already voted on this proposal' };
      }

      try {
        if (reason) {
          castVote({
            address: ANDE_GOVERNOR_ADDRESS,
            abi: AndeGovernorABI,
            functionName: 'castVoteWithReason',
            args: [proposalId, support, reason],
          });
        } else {
          castVote({
            address: ANDE_GOVERNOR_ADDRESS,
            abi: AndeGovernorABI,
            functionName: 'castVote',
            args: [proposalId, support],
          });
        }

        return { success: true };
      } catch (error: any) {
        console.error('Error casting vote:', error);
        return { success: false, error: error.message || 'Failed to cast vote' };
      }
    },
    [address, hasVotingPower, castVote, hasVoted]
  );

  /**
   * Queue a successful proposal
   */
  const queue = useCallback(
    async (
      targets: Address[],
      values: bigint[],
      calldatas: string[],
      descriptionHash: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      try {
        queueProposal({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'queue',
          args: [targets, values, calldatas, descriptionHash],
        });

        return { success: true };
      } catch (error: any) {
        console.error('Error queuing proposal:', error);
        return { success: false, error: error.message || 'Failed to queue proposal' };
      }
    },
    [address, queueProposal]
  );

  /**
   * Execute a queued proposal
   */
  const execute = useCallback(
    async (
      targets: Address[],
      values: bigint[],
      calldatas: string[],
      descriptionHash: string
    ): Promise<{ success: boolean; error?: string }> => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      try {
        executeProposal({
          address: ANDE_GOVERNOR_ADDRESS,
          abi: AndeGovernorABI,
          functionName: 'execute',
          args: [targets, values, calldatas, descriptionHash],
        });

        return { success: true };
      } catch (error: any) {
        console.error('Error executing proposal:', error);
        return { success: false, error: error.message || 'Failed to execute proposal' };
      }
    },
    [address, executeProposal]
  );

  /**
   * Delegate voting power
   */
  const delegate = useCallback(
    async (delegatee: Address): Promise<{ success: boolean; error?: string }> => {
      if (!address) {
        return { success: false, error: 'Wallet not connected' };
      }

      if (!tokenBalance || tokenBalance === 0n) {
        return { success: false, error: 'No ANDE tokens to delegate' };
      }

      try {
        delegateVotes({
          address: ANDE_TOKEN_ADDRESS,
          abi: AndeTokenABI,
          functionName: 'delegate',
          args: [delegatee],
        });

        return { success: true };
      } catch (error: any) {
        console.error('Error delegating votes:', error);
        return { success: false, error: error.message || 'Failed to delegate votes' };
      }
    },
    [address, tokenBalance, delegateVotes]
  );

  /**
   * Self-delegate (required to activate voting power)
   */
  const selfDelegate = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!address) {
      return { success: false, error: 'Wallet not connected' };
    }

    return delegate(address);
  }, [address, delegate]);

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  const getProposalStateName = (state: ProposalState): string => {
    return PROPOSAL_STATE_NAMES[state] || 'Unknown';
  };

  const isProposalActive = (state: ProposalState): boolean => {
    return state === ProposalState.Active;
  };

  const canVote = (state: ProposalState): boolean => {
    return state === ProposalState.Active && hasVotingPower;
  };

  const canQueue = (state: ProposalState): boolean => {
    return state === ProposalState.Succeeded;
  };

  const canExecute = (state: ProposalState): boolean => {
    return state === ProposalState.Queued;
  };

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // Connection state
    isConnected,
    address,

    // Governance stats
    governanceStats,
    hasVotingPower,
    canCreateProposal,

    // Token info
    tokenBalance,

    // Proposal functions
    createProposal,
    vote,
    queue,
    execute,
    delegate,
    selfDelegate,
    getProposalState,
    getProposalVotes,
    getProposalSnapshot,
    getProposalDeadline,
    getProposalEta,
    hasVoted,
    hashProposal,

    // Helper functions
    getProposalStateName,
    isProposalActive,
    canVote,
    canQueue,
    canExecute,

    // Transaction states
    isProposing: isProposing || isProposeConfirming,
    isProposeSuccess,
    isVoting: isVoting || isVoteConfirming,
    isVoteSuccess,
    isQueuing: isQueuing || isQueueConfirming,
    isQueueSuccess,
    isExecuting: isExecuting || isExecuteConfirming,
    isExecuteSuccess,
    isDelegating: isDelegating || isDelegateConfirming,
    isDelegateSuccess,

    // Refetch functions
    refetchVotingPower,

    // Enums
    ProposalState,
    VoteType,
    ProposalType,
  };
}