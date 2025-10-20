'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useBlockNumber, useBlock, useFeeData, usePublicClient } from 'wagmi';
import { andechainTestnet as andechain } from '@/lib/chains';
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
const MAX_BLOCK_AGE_SECONDS = 10; // 10 seconds threshold for stalled detection
const SLOW_BLOCK_THRESHOLD = 6; // 6 seconds threshold for slow detection
const EXPECTED_BLOCK_TIME = 2; // 2 seconds for ANDE
const RPC_LATENCY_CHECK_INTERVAL = 10000; // Check every 10 seconds
const HEALTH_CHECK_INTERVAL = 3000; // Check health every 3 seconds

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
  
  const lastBlockNumberRef = useRef<bigint>(BigInt(0));
  const lastBlockUpdateTimeRef = useRef<number>(Date.now());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const publicClient = usePublicClient({ chainId: andechain.id });

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
        avgGasPrice: feeData?.gasPrice || BigInt(0),
      };
    }

    // Calculate total transactions
    const totalTransactions = blocks.reduce((sum, block) => sum + block.transactions, 0);

    // Calculate average block time (in seconds)
    const timeSpan = Number(blocks[0].timestamp - blocks[blocks.length - 1].timestamp);
    const avgBlockTime = timeSpan > 0 ? timeSpan / (blocks.length - 1) : 0;

    // Calculate TPS (transactions per second)
    const tps = timeSpan > 0 ? totalTransactions / timeSpan : 0;

    // Calculate gas utilization
    const totalGasUsed = blocks.reduce((sum, block) => sum + block.gasUsed, BigInt(0));
    const totalGasLimit = blocks.reduce((sum, block) => sum + block.gasLimit, BigInt(0));
    const gasUtilization = totalGasLimit > BigInt(0)
      ? Number((totalGasUsed * BigInt(10000)) / totalGasLimit) / 100
      : 0;

    // Calculate average gas used per block
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

  // Calculate network health using block number progression
  const calculateHealth = useCallback((): NetworkHealth => {
    const now = Date.now();
    const timeSinceLastBlock = Math.floor((now - lastBlockUpdateTimeRef.current) / 1000);
    
    // Determine block production rate based on time since last block update
    let blockProductionRate: 'normal' | 'slow' | 'stalled' = 'normal';
    
    if (timeSinceLastBlock > MAX_BLOCK_AGE_SECONDS) {
      blockProductionRate = 'stalled';
    } else if (timeSinceLastBlock > SLOW_BLOCK_THRESHOLD) {
      blockProductionRate = 'slow';
    }

    // Network is healthy if we've seen a new block recently
    const isHealthy = blockProductionRate === 'normal';

    return {
      isHealthy,
      rpcLatency: 0, // Will be updated separately
      blockProductionRate,
      lastBlockAge: timeSinceLastBlock,
    };
  }, []);

  // Measure RPC latency
  const measureRpcLatency = useCallback(async () => {
    if (!andechain.rpcUrls.default.http[0]) return;

    try {
      const start = performance.now();
      const response = await fetch(andechain.rpcUrls.default.http[0], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_blockNumber',
          params: [],
          id: Date.now(),
        }),
      });
      
      if (response.ok) {
        await response.json();
        const latency = Math.round(performance.now() - start);
        
        setHealth(prev => ({ ...prev, rpcLatency: latency }));
      }
    } catch (error) {
      console.error('Failed to measure RPC latency:', error);
      setHealth(prev => ({ ...prev, rpcLatency: 9999 }));
    }
  }, []);

  // Continuous health monitoring
  const monitorHealth = useCallback(() => {
    const newHealth = calculateHealth();
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[NetworkStatus] Health Check:', {
        isHealthy: newHealth.isHealthy,
        blockProductionRate: newHealth.blockProductionRate,
        lastBlockAge: newHealth.lastBlockAge,
        currentBlock: lastBlockNumberRef.current.toString(),
        lastUpdateTime: new Date(lastBlockUpdateTimeRef.current).toISOString(),
      });
    }
    
    setHealth(prev => ({ ...prev, ...newHealth }));
  }, [calculateHealth]);

  // Load initial block history
  useEffect(() => {
    if (!publicClient || !blockNumber || blockHistory.length >= BLOCKS_TO_ANALYZE) return;

    const loadInitialBlocks = async () => {
      try {
        const blocksToFetch = Math.min(Number(blockNumber), BLOCKS_TO_ANALYZE);
        const startBlock = blockNumber - BigInt(blocksToFetch - 1);

        const blockPromises = Array.from({ length: blocksToFetch }, (_, i) => 
          publicClient.getBlock({ blockNumber: startBlock + BigInt(i) })
        );

        const blocks = await Promise.all(blockPromises);
        const blockInfos = blocks.map(convertBlock).reverse(); // Most recent first

        setBlockHistory(blockInfos);
        setIsLoadingHistory(false);
      } catch (error) {
        console.error('Failed to load initial blocks:', error);
        setIsLoadingHistory(false);
      }
    };

    if (isLoadingHistory) {
      loadInitialBlocks();
    }
  }, [publicClient, blockNumber, convertBlock, isLoadingHistory, blockHistory.length]);

  // Update block history when new block arrives
  useEffect(() => {
    if (!latestBlock || isLoadingHistory) return;

    const blockInfo = convertBlock(latestBlock);
    
    // Only add if it's actually a new block
    if (blockInfo.number > lastBlockNumberRef.current) {
      lastBlockNumberRef.current = blockInfo.number;
      lastBlockUpdateTimeRef.current = Date.now();
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[NetworkStatus] New block:', {
          blockNumber: blockInfo.number.toString(),
          transactions: blockInfo.transactions,
          gasUsed: blockInfo.gasUsed.toString(),
        });
      }
      
      setBlockHistory(prev => {
        // Check if block already exists
        if (prev.some(b => b.number === blockInfo.number)) {
          return prev;
        }

        // Add new block and keep only recent ones
        return [blockInfo, ...prev].slice(0, BLOCKS_TO_ANALYZE);
      });
      
      // Immediately update health when new block arrives
      const newHealth = calculateHealth();
      setHealth(prev => ({ ...prev, ...newHealth }));
    }
  }, [latestBlock, convertBlock, isLoadingHistory, calculateHealth]);

  // Calculate metrics when history changes
  useEffect(() => {
    if (blockHistory.length > 0) {
      const newMetrics = calculateMetrics(blockHistory);
      setMetrics(newMetrics);
    }
  }, [blockHistory, calculateMetrics]);

  // Initial RPC latency measurement
  useEffect(() => {
    measureRpcLatency();
    const interval = setInterval(measureRpcLatency, RPC_LATENCY_CHECK_INTERVAL);
    return () => clearInterval(interval);
  }, [measureRpcLatency]);

  // Continuous health monitoring
  useEffect(() => {
    // Initial health check
    monitorHealth();

    // Set up interval for continuous monitoring
    healthCheckIntervalRef.current = setInterval(monitorHealth, HEALTH_CHECK_INTERVAL);

    return () => {
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
      }
    };
  }, [monitorHealth]);

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