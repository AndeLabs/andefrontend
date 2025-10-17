'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Activity, AlertTriangle, CheckCircle2, Clock, XCircle, Zap } from 'lucide-react';
import type { NetworkHealth } from '@/hooks/use-network-status';

interface NetworkHealthIndicatorProps {
  health: NetworkHealth;
}

export function NetworkHealthIndicator({ health }: NetworkHealthIndicatorProps) {
  const getStatusBadge = () => {
    if (health.isHealthy) {
      return (
        <Badge className="gap-2 bg-green-500 hover:bg-green-600">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-100"></span>
          </span>
          Healthy
        </Badge>
      );
    }

    if (health.blockProductionRate === 'slow') {
      return (
        <Badge className="gap-2 bg-yellow-500 hover:bg-yellow-600">
          <AlertTriangle className="h-3 w-3" />
          Degraded
        </Badge>
      );
    }

    return (
      <Badge className="gap-2 bg-red-500 hover:bg-red-600">
        <XCircle className="h-3 w-3" />
        Unhealthy
      </Badge>
    );
  };

  const getBlockProductionStatus = () => {
    switch (health.blockProductionRate) {
      case 'normal':
        return {
          icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
          label: 'Normal',
          color: 'text-green-600',
        };
      case 'slow':
        return {
          icon: <Clock className="h-4 w-4 text-yellow-500" />,
          label: 'Slow',
          color: 'text-yellow-600',
        };
      case 'stalled':
        return {
          icon: <XCircle className="h-4 w-4 text-red-500" />,
          label: 'Stalled',
          color: 'text-red-600',
        };
    }
  };

  const blockProductionStatus = getBlockProductionStatus();

  const getLatencyStatus = () => {
    if (health.rpcLatency < 100) {
      return { color: 'text-green-600', label: 'Excellent' };
    }
    if (health.rpcLatency < 300) {
      return { color: 'text-yellow-600', label: 'Good' };
    }
    return { color: 'text-red-600', label: 'Poor' };
  };

  const latencyStatus = getLatencyStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Network Health</CardTitle>
            <CardDescription>Real-time operational status</CardDescription>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              Block Production
            </div>
            <div className="flex items-center gap-2">
              {blockProductionStatus.icon}
              <span className={`font-semibold ${blockProductionStatus.color}`}>
                {blockProductionStatus.label}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="h-4 w-4" />
              RPC Latency
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${latencyStatus.color}`}>
                {health.rpcLatency}ms
              </span>
              <span className="text-xs text-muted-foreground">
                ({latencyStatus.label})
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last Block Age
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {health.lastBlockAge}s
              </span>
              <span className="text-xs text-muted-foreground">ago</span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="text-sm font-medium">Status Details</div>
          <div className="text-xs text-muted-foreground space-y-1">
            {health.isHealthy ? (
              <>
                <p>✓ All systems operational</p>
                <p>✓ Block production is normal</p>
                <p>✓ RPC connection is stable</p>
              </>
            ) : (
              <>
                {health.blockProductionRate === 'stalled' && (
                  <p className="text-red-600">✗ Block production has stalled</p>
                )}
                {health.blockProductionRate === 'slow' && (
                  <p className="text-yellow-600">! Block production is slower than expected</p>
                )}
                {health.lastBlockAge > 30 && (
                  <p className="text-yellow-600">
                    ! Last block was produced {health.lastBlockAge} seconds ago
                  </p>
                )}
                {health.rpcLatency > 500 && (
                  <p className="text-yellow-600">! High RPC latency detected</p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}