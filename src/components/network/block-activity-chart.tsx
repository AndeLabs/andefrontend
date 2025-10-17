'use client';

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import type { BlockInfo } from '@/hooks/use-network-status';

interface BlockActivityChartProps {
  blocks: BlockInfo[];
  metric: 'transactions' | 'gasUsed' | 'gasUtilization';
}

export function BlockActivityChart({ blocks, metric }: BlockActivityChartProps) {
  const chartData = useMemo(() => {
    return blocks
      .slice()
      .reverse()
      .map((block) => {
        const gasUtilization = block.gasLimit > BigInt(0)
          ? Number((block.gasUsed * BigInt(10000)) / block.gasLimit) / 100
          : 0;

        return {
          block: Number(block.number),
          timestamp: Number(block.timestamp) * 1000,
          transactions: block.transactions,
          gasUsed: Number(block.gasUsed) / 1_000_000, // Convert to millions
          gasUtilization,
        };
      });
  }, [blocks]);

  const getMetricConfig = () => {
    switch (metric) {
      case 'transactions':
        return {
          dataKey: 'transactions',
          name: 'Transactions',
          color: '#8b5cf6',
          unit: '',
        };
      case 'gasUsed':
        return {
          dataKey: 'gasUsed',
          name: 'Gas Used',
          color: '#f59e0b',
          unit: 'M',
        };
      case 'gasUtilization':
        return {
          dataKey: 'gasUtilization',
          name: 'Gas Utilization',
          color: '#10b981',
          unit: '%',
        };
      default:
        return {
          dataKey: 'transactions',
          name: 'Transactions',
          color: '#8b5cf6',
          unit: '',
        };
    }
  };

  const config = getMetricConfig();

  if (chartData.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData}>
        <defs>
          <linearGradient id={`color${metric}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={config.color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={config.color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="block"
          tickFormatter={(value) => `#${value}`}
          className="text-xs"
          stroke="currentColor"
          tick={{ fill: 'currentColor' }}
        />
        <YAxis
          className="text-xs"
          stroke="currentColor"
          tick={{ fill: 'currentColor' }}
          tickFormatter={(value) => `${value}${config.unit}`}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload;
              return (
                <div className="bg-background border border-border rounded-lg shadow-lg p-3">
                  <p className="text-sm font-semibold mb-2">
                    Block #{data.block}
                  </p>
                  <p className="text-xs text-muted-foreground mb-1">
                    {format(new Date(data.timestamp), 'PPpp')}
                  </p>
                  <p className="text-sm font-medium" style={{ color: config.color }}>
                    {config.name}: {payload[0].value}{config.unit}
                  </p>
                </div>
              );
            }
            return null;
          }}
        />
        <Area
          type="monotone"
          dataKey={config.dataKey}
          stroke={config.color}
          strokeWidth={2}
          fillOpacity={1}
          fill={`url(#color${metric})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}