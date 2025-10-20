import { useEffect, useState } from 'react';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { andechainTestnet as andechain } from '@/lib/chains';

interface ChainStats {
  tps: number;
  avgBlockTime: number;
  totalTransactions: number;
  isLoading: boolean;
}

export function useChainStats() {
  const publicClient = usePublicClient({ chainId: andechain.id });
  const { data: currentBlock } = useBlockNumber({ watch: true, chainId: andechain.id });
  
  const [stats, setStats] = useState<ChainStats>({
    tps: 0,
    avgBlockTime: 0,
    totalTransactions: 0,
    isLoading: true,
  });

  useEffect(() => {
    if (!publicClient || !currentBlock) return;

    const calculateStats = async () => {
      try {
        const blocksToAnalyze = BigInt(10);
        const startBlock = currentBlock - blocksToAnalyze > BigInt(0) ? currentBlock - blocksToAnalyze : BigInt(1);
        
        const blocks = await Promise.all(
          Array.from({ length: Number(blocksToAnalyze) }, (_, i) => 
            publicClient.getBlock({ blockNumber: startBlock + BigInt(i) })
          )
        );

        let totalTxs = 0;
        let totalTimeDiff = 0;
        
        for (let i = 1; i < blocks.length; i++) {
          totalTxs += blocks[i].transactions.length;
          totalTimeDiff += Number(blocks[i].timestamp - blocks[i - 1].timestamp);
        }

        const avgBlockTime = totalTimeDiff / (blocks.length - 1);
        const tps = avgBlockTime > 0 ? totalTxs / totalTimeDiff : 0;

        setStats({
          tps: parseFloat(tps.toFixed(2)),
          avgBlockTime: parseFloat(avgBlockTime.toFixed(2)),
          totalTransactions: totalTxs,
          isLoading: false,
        });
      } catch (error) {
        console.error('Error calculating chain stats:', error);
        setStats(prev => ({ ...prev, isLoading: false }));
      }
    };

    calculateStats();
  }, [publicClient, currentBlock]);

  return stats;
}
