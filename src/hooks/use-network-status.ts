'use client';

import { useEffect, useState, useCallback } from 'react';
import { useBlockNumber, useBlock, useFeeData } from 'wagmi';
import { andechain } from '@/lib/chains';
import type { Block } from 'viem';

export interface BlockInfo {
  number: bigint;
  hash: string;
  timestamp: bigint;
  transactions: number;
  gasUsed: bigint;
  gasLimit: bigint;
  baseFeePerGas?: bigint;
  miner: string;
}

export interface NetworkMetrics {
  tps: number;
  avgBlockTime: number;
  gasUtilization: number;
  totalTransactions: number;
  avgGasUsed: bigint;
  avgGasPrice: bigint;
}

export interface NetworkHealth {
  isHealthy: boolean;
  rpcLatency: number;
  blockProductionRate: 'normal' | 'slow' | 'stalled';
  lastBlockAge: number;
}

const BLOCKS_TO_ANALYZE = 20;
const MAX_BLOCK_AGE_SECONDS = 30;
const EXPECTED_BLOCK_TIME = 2; // 2 seconds for ANDE

export function useNetworkStatus() {
  const [blockHistory, setBlockHistory] = useState<BlockInfo[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics>({
    tps: 0,
    avgBlockTime: 0,
    gasUtilization: 0,
    totalTransactions: 0,
    avgGasUsed: BigInt(0),
    avgGasPrice: BigInt(0),
  });
  const [health, setHealth] = useState<NetworkHealth>({
    isHealthy: true,
    rpcLatency: 0,
    blockProductionRate: 'normal',
    lastBlockAge: 0,
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Watch for new blocks
  const { data: blockNumber } = useBlockNumber({
    watch: true,
    chainId: andechain.id,
    cacheTime: 2_000,
  });

  const { data: latestBlock } = useBlock({
    chainId: andechain.id,
    blockNumber: blockNumber,
  });

  const { data: feeData } = useFeeData({
    chainId: andechain.id,
  });

  // Convert Block to BlockInfo
  const convertBlock = useCallback((block: Block): BlockInfo => {
    return {
      number: block.number!,
      hash: block.hash!,
      timestamp: block.timestamp,
      transactions: block.transactions.length,
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      baseFeePerGas: block.baseFeePerGas || undefined,
      miner: block.miner!,
    };
  }, []);

  // Calculate metrics from block history
  const calculateMetrics = useCallback((blocks: BlockInfo[]): NetworkMetrics => {
    if (blocks.length < 2) {
      return {
        tps: 0,
        avgBlockTime: 0,
        gasUtilization: 0,
        totalTransactions: 0,
        avgGasUsed: BigInt(0),
        avgGasPrice: BigInt(0),
      };
    }

    // Calculate total transactions
    const totalTransactions = blocks.reduce((sum, block) => sum + block.transactions, 0);

    // Calculate average block time
    const timeSpan = Number(blocks[0].timestamp - blocks[blocks.length - 1].timestamp);
    const avgBlockTime = timeSpan > 0 ? timeSpan / (blocks.length - 1) : 0;

    // Calculate TPS
    const tps = avgBlockTime > 0 ? totalTransactions / timeSpan : 0;

    // Calculate gas utilization
    const totalGasUsed = blocks.reduce((sum, block) => sum + block.gasUsed, BigInt(0));
    const totalGasLimit = blocks.reduce((sum, block) => sum + block.gasLimit, BigInt(0));
    const gasUtilization = totalGasLimit > BigInt(0)
      ? Number((totalGasUsed * BigInt(10000)) / totalGasLimit) / 100
      : 0;

    // Calculate average gas used
    const avgGasUsed = totalGasUsed / BigInt(blocks.length);

    return {
      tps: Math.round(tps * 100) / 100,
      avgBlockTime: Math.round(avgBlockTime * 100) / 100,
      gasUtilization: Math.round(gasUtilization * 100) / 100,
      totalTransactions,
      avgGasUsed,
      avgGasPrice: feeData?.gasPrice || BigInt(0),
    };
  }, [feeData?.gasPrice]);

  // Calculate network health
  const calculateHealth = useCallback((blocks: BlockInfo[]): NetworkHealth => {
    if (blocks.length === 0) {
      return {
        isHealthy: false,
        rpcLatency: 0,
        blockProductionRate: 'stalled',
        lastBlockAge: 0,
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const lastBlockAge = now - Number(blocks[0].timestamp);
    
    // Determine block production rate
    let blockProductionRate: 'normal' | 'slow' | 'stalled' = 'normal';
    if (lastBlockAge > MAX_BLOCK_AGE_SECONDS * 2) {
      blockProductionRate = 'stalled';
    } else if (lastBlockAge > MAX_BLOCK_AGE_SECONDS) {
      blockProductionRate = 'slow';
    }

    // Calculate average block time from recent blocks
    let avgRecentBlockTime = EXPECTED_BLOCK_TIME;
    if (blocks.length >= 2) {
      const recentTimeSpan = Number(blocks[0].timestamp - blocks[Math.min(4, blocks.length - 1)].timestamp);
      avgRecentBlockTime = recentTimeSpan / Math.min(4, blocks.length - 1);
    }

    const isHealthy = blockProductionRate === 'normal' && lastBlockAge < MAX_BLOCK_AGE_SECONDS;

    return {
      isHealthy,
      rpcLatency: 0, // Will be calculated via ping
      blockProductionRate,
      lastBlockAge,
    };
  }, []);

  // Measure RPC latency
  const measureRpcLatency = useCallback(async () => {
    try {
      const start = performance.now();
      const response = await fetch(andechain.rpcUrls.default.http[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: 1,
        }),
      });
      await response.json();
      const latency = performance.now() - start;
      
      setHealth(prev => ({ ...prev, rpcLatency: Math.round(latency) }));
    } catch (error) {
      console.error('Failed to measure RPC latency:', error);
    }
  }, []);

  // Update block history when new block arrives
  useEffect(() => {
    if (!latestBlock) return;

    const blockInfo = convertBlock(latestBlock);
    
    setBlockHistory(prev => {
      // Check if block already exists
      if (prev.some(b => b.number === blockInfo.number)) {
        return prev;
      }

      // Add new block and keep only recent ones
      const updated = [blockInfo, ...prev].slice(0, BLOCKS_TO_ANALYZE);
      return updated;
    });
  }, [latestBlock, convertBlock]);

  // Calculate metrics when history changes
  useEffect(() => {
    if (blockHistory.length > 0) {
      const newMetrics = calculateMetrics(blockHistory);
      setMetrics(newMetrics);

      const newHealth = calculateHealth(blockHistory);
      setHealth(prev => ({ ...prev, ...newHealth }));

      setIsLoadingHistory(false);
    }
  }, [blockHistory, calculateMetrics, calculateHealth]);

  // Measure RPC latency periodically
  useEffect(() => {
    measureRpcLatency();
    const interval = setInterval(measureRpcLatency, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, [measureRpcLatency]);

  return {
    blockHistory,
    metrics,
    health,
    latestBlock: blockHistory[0],
    isLoading: isLoadingHistory,
    gasPrice: feeData?.gasPrice,
    maxFeePerGas: feeData?.maxFeePerGas,
    maxPriorityFeePerGas: feeData?.maxPriorityFeePerGas,
  };
}