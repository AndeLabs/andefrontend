'use client';

import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, User, Zap } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { BlockInfo } from '@/hooks/use-network-status';
import { andechain } from '@/lib/chains';

interface RecentBlocksTableProps {
  blocks: BlockInfo[];
  isLoading?: boolean;
}

export function RecentBlocksTable({ blocks, isLoading }: RecentBlocksTableProps) {
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const getGasUsageColor = (gasUsed: bigint, gasLimit: bigint) => {
    const percentage = Number((gasUsed * BigInt(100)) / gasLimit);
    if (percentage < 30) return 'text-green-600';
    if (percentage < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const explorerUrl = andechain.blockExplorers?.default?.url;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Blocks</CardTitle>
          <CardDescription>Latest blocks produced on the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (blocks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Blocks</CardTitle>
          <CardDescription>Latest blocks produced on the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No blocks available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Blocks</CardTitle>
        <CardDescription>
          Showing the latest {blocks.length} blocks in real-time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Header */}
          <div className="hidden md:grid md:grid-cols-7 gap-4 px-3 py-2 text-xs font-medium text-muted-foreground border-b">
            <div>Block</div>
            <div className="col-span-2">Hash</div>
            <div>Txs</div>
            <div>Gas Used</div>
            <div>Validator</div>
            <div>Age</div>
          </div>

          {/* Rows */}
          <div className="space-y-2">
            {blocks.slice(0, 10).map((block) => {
              const gasUtilization = block.gasLimit > BigInt(0)
                ? Number((block.gasUsed * BigInt(100)) / block.gasLimit)
                : 0;
              const timestamp = Number(block.timestamp) * 1000;

              return (
                <div
                  key={block.hash}
                  className="grid grid-cols-1 md:grid-cols-7 gap-2 md:gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Block Number */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground md:hidden">Block:</span>
                    <Link
                      href={explorerUrl ? `${explorerUrl}/block/${block.number}` : '#'}
                      className="font-mono font-semibold text-primary hover:underline flex items-center gap-1"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      #{block.number.toString()}
                      {explorerUrl && <ExternalLink className="h-3 w-3" />}
                    </Link>
                  </div>

                  {/* Hash */}
                  <div className="col-span-1 md:col-span-2 flex items-center gap-2">
                    <span className="text-xs text-muted-foreground md:hidden">Hash:</span>
                    <code className="text-xs font-mono text-muted-foreground">
                      {formatHash(block.hash)}
                    </code>
                  </div>

                  {/* Transactions */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground md:hidden">Txs:</span>
                    <Badge variant={block.transactions > 0 ? 'default' : 'secondary'}>
                      {block.transactions} tx{block.transactions !== 1 ? 's' : ''}
                    </Badge>
                  </div>

                  {/* Gas Used */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground md:hidden">Gas:</span>
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span
                        className={`text-xs font-medium ${getGasUsageColor(
                          block.gasUsed,
                          block.gasLimit
                        )}`}
                      >
                        {gasUtilization.toFixed(1)}%
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {(Number(block.gasUsed) / 1_000_000).toFixed(2)}M
                    </span>
                  </div>

                  {/* Validator/Miner */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground md:hidden">Validator:</span>
                    <User className="h-3 w-3 text-muted-foreground" />
                    <code className="text-xs font-mono text-muted-foreground">
                      {formatAddress(block.miner)}
                    </code>
                  </div>

                  {/* Age */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground md:hidden">Age:</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(timestamp, { addSuffix: true })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}