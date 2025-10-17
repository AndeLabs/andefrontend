'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import { useBlockNumber, useGasPrice, useBlock } from 'wagmi';
import { formatGwei } from 'viem';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { andechain } from '@/lib/chains';
import {
  Blocks,
  Zap,
  Activity,
  Wifi,
  WifiOff,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChainInfoCardProps {
  /** Mostrar solo información compacta */
  compact?: boolean;
  /** Intervalo de polling en ms (default: 5000) */
  pollInterval?: number;
}

/**
 * ChainInfoCard - Muestra información en tiempo real de la blockchain
 *
 * Características:
 * - Block number actual (polling cada 5s)
 * - Gas price promedio
 * - Network status (Online/Offline con latencia)
 * - RPC endpoint configurado
 * - Indicador visual de conexión
 */
export function ChainInfoCard({ compact = false, pollInterval = 5000 }: ChainInfoCardProps) {
  const { data: blockNumber, isLoading: isBlockLoading } = useBlockNumber({
    chainId: andechain.id,
    query: {
      refetchInterval: pollInterval,
    },
  });

  const { data: gasPrice, isLoading: isGasLoading } = useGasPrice({
    chainId: andechain.id,
    query: {
      refetchInterval: pollInterval,
    },
  });

  const { data: block, isLoading: isBlockDataLoading } = useBlock({
    chainId: andechain.id,
    blockTag: 'latest',
    query: {
      refetchInterval: pollInterval,
    },
  });

  const [networkLatency, setNetworkLatency] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Medir latencia del RPC
  const measureLatency = useCallback(async () => {
    const rpcUrl = andechain.rpcUrls.default.http[0];
    if (!rpcUrl) return;

    try {
      const startTime = performance.now();
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_chainId',
          params: [],
          id: 1,
        }),
      });

      if (response.ok) {
        const endTime = performance.now();
        setNetworkLatency(Math.round(endTime - startTime));
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      setIsOnline(false);
    }
  }, []);

  // Medir latencia periódicamente
  useEffect(() => {
    measureLatency();
    const interval = setInterval(measureLatency, pollInterval);
    return () => clearInterval(interval);
  }, [measureLatency, pollInterval]);

  // Formatear gas price
  const formattedGasPrice = useMemo(() => {
    if (!gasPrice) return null;
    return parseFloat(formatGwei(gasPrice)).toFixed(2);
  }, [gasPrice]);

  // Formatear timestamp del bloque
  const blockTime = useMemo(() => {
    if (!block?.timestamp) return null;
    const date = new Date(Number(block.timestamp) * 1000);
    return date.toLocaleTimeString();
  }, [block?.timestamp]);

  // Contar transacciones en el bloque
  const transactionCount = useMemo(() => {
    if (!block?.transactions) return 0;
    return Array.isArray(block.transactions) ? block.transactions.length : 0;
  }, [block?.transactions]);

  // ============================================================================
  // VISTA COMPACTA
  // ============================================================================
  if (compact) {
    return (
      <Card className="h-full">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Network Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {networkLatency !== null && (
                <span className="text-xs text-muted-foreground">
                  {networkLatency}ms
                </span>
              )}
            </div>

            {/* Block Number */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Blocks className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Block</span>
              </div>
              {isBlockLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="text-sm font-mono">
                  {blockNumber?.toString() || '—'}
                </span>
              )}
            </div>

            {/* Gas Price */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Gas</span>
              </div>
              {isGasLoading ? (
                <Skeleton className="h-4 w-16" />
              ) : (
                <span className="text-sm font-mono">
                  {formattedGasPrice ? `${formattedGasPrice} Gwei` : '—'}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // VISTA COMPLETA
  // ============================================================================
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Chain Information
            </CardTitle>
            <CardDescription>
              Real-time network status for {andechain.name}
            </CardDescription>
          </div>
          <div
            className={cn(
              'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
              isOnline
                ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                : 'bg-red-500/10 text-red-700 dark:text-red-400'
            )}
          >
            {isOnline ? (
              <Wifi className="h-4 w-4" />
            ) : (
              <WifiOff className="h-4 w-4" />
            )}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Block Number */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Blocks className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Block Number
            </span>
          </div>
          {isBlockLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-bold font-mono">
              {blockNumber?.toString() || '—'}
            </div>
          )}
        </div>

        {/* Gas Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-muted-foreground">
              Gas Price
            </span>
          </div>
          {isGasLoading ? (
            <Skeleton className="h-8 w-32" />
          ) : (
            <div className="text-2xl font-bold font-mono">
              {formattedGasPrice ? `${formattedGasPrice}` : '—'}
              <span className="text-sm text-muted-foreground ml-2">Gwei</span>
            </div>
          )}
        </div>

        {/* Block Time */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Latest Block Time
          </span>
          {isBlockDataLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="text-sm font-mono">
              {blockTime || '—'}
            </div>
          )}
        </div>

        {/* Transaction Count */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Transactions in Latest Block
          </span>
          {isBlockDataLoading ? (
            <Skeleton className="h-6 w-16" />
          ) : (
            <div className="text-sm font-mono">
              {transactionCount} tx
            </div>
          )}
        </div>

        {/* Network Latency */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            Network Latency
          </span>
          <div className="text-sm font-mono">
            {networkLatency !== null ? `${networkLatency}ms` : '—'}
          </div>
        </div>

        {/* RPC Endpoint */}
        <div className="space-y-2">
          <span className="text-sm font-medium text-muted-foreground">
            RPC Endpoint
          </span>
          <div className="text-xs font-mono break-all text-muted-foreground">
            {andechain.rpcUrls.default.http[0]}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Network Status</span>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                )}
              />
              <span className="font-medium">
                {isOnline ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
