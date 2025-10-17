'use client';

import { ChainExplorer } from '@/components/chain-explorer';
import { Faucet } from '@/components/faucet';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAccount, useBalance, useBlockNumber } from 'wagmi';
import { Activity, Zap, Code2, Boxes } from 'lucide-react';

export default function DeveloperPage() {
  const { address, isConnected } = useAccount();
  const { data: blockNumber } = useBlockNumber({ watch: true });
  const { data: balance } = useBalance({ address });

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Developer Tools</h2>
          <p className="text-muted-foreground">
            Interact with your local AndeChain development environment
          </p>
        </div>
        <Badge variant="outline" className="h-8">
          <Activity className="mr-2 h-3 w-3" />
          Local Chain Active
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Block</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {blockNumber ? `#${blockNumber.toString()}` : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              Latest block height
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your Balance</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {balance ? `${parseFloat(balance.formatted).toFixed(4)} ${balance.symbol}` : '---'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isConnected ? 'Connected wallet' : 'Not connected'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">RPC Endpoint</CardTitle>
            <Code2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">localhost:8545</div>
            <p className="text-xs text-muted-foreground">
              EV-Reth node
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chain ID</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8086</div>
            <p className="text-xs text-muted-foreground">
              AndeChain Local
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Faucet />
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
            <CardDescription>Development resources and endpoints</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="http://localhost:9090"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">Prometheus Metrics</p>
                <p className="text-xs text-muted-foreground">View chain metrics</p>
              </div>
              <Badge>:9090</Badge>
            </a>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">Grafana Dashboard</p>
                <p className="text-xs text-muted-foreground">admin / ande_dev_2025</p>
              </div>
              <Badge>:3000</Badge>
            </a>
            <a
              href="http://localhost:26658"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">Celestia Light Node</p>
                <p className="text-xs text-muted-foreground">DA layer RPC</p>
              </div>
              <Badge>:26658</Badge>
            </a>
            <a
              href="http://localhost:7331"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
            >
              <div>
                <p className="font-medium">Sequencer RPC</p>
                <p className="text-xs text-muted-foreground">Rollkit sequencer</p>
              </div>
              <Badge>:7331</Badge>
            </a>
          </CardContent>
        </Card>
      </div>

      <ChainExplorer />
    </div>
  );
}
