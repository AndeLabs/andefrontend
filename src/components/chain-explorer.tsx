'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePublicClient, useBlockNumber } from 'wagmi';
import { formatEther } from 'viem';
import { Loader2, Activity, Database, Clock } from 'lucide-react';

interface BlockData {
  number: bigint;
  hash: string;
  timestamp: bigint;
  transactions: readonly string[];
  gasUsed: bigint;
  gasLimit: bigint;
}

export function ChainExplorer() {
  const publicClient = usePublicClient();
  const { data: currentBlock } = useBlockNumber({ watch: true });
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentBlock || !publicClient) return;

    const fetchRecentBlocks = async () => {
      try {
        setLoading(true);
        const blockPromises = [];
        for (let i = 0; i < 10; i++) {
          const blockNumber = currentBlock - BigInt(i);
          if (blockNumber >= BigInt(0)) {
            blockPromises.push(
              publicClient.getBlock({ blockNumber })
            );
          }
        }
        const fetchedBlocks = await Promise.all(blockPromises);
        setBlocks(fetchedBlocks as BlockData[]);
      } catch (error) {
        console.error('Error fetching blocks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentBlocks();
  }, [currentBlock, publicClient]);

  const formatTimestamp = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleTimeString();
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              AndeChain Explorer
            </CardTitle>
            <CardDescription>Latest blocks on your local chain</CardDescription>
          </div>
          {currentBlock && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              Block #{currentBlock.toString()}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {blocks.map((block) => (
              <div
                key={block.hash}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="font-mono font-medium">
                      #{block.number.toString()}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatHash(block.hash)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTimestamp(block.timestamp)}
                    </div>
                    <div>
                      {block.transactions.length} tx{block.transactions.length !== 1 ? 's' : ''}
                    </div>
                    <div>
                      Gas: {((Number(block.gasUsed) / Number(block.gasLimit)) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
                <Badge variant={block.transactions.length > 0 ? 'default' : 'secondary'}>
                  {block.transactions.length > 0 ? 'Active' : 'Empty'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
