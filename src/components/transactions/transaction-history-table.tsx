'use client';

import { useState, useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ExternalLink,
  Copy,
  CheckCircle2,
  XCircle,
  Clock,
  FileCode,
  Search,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { TransactionDetailed } from '@/hooks/use-transaction-history';
import { andechain } from '@/lib/chains';

interface TransactionHistoryTableProps {
  transactions: TransactionDetailed[];
  isLoading?: boolean;
  emptyMessage?: string;
}

type SortField = 'timestamp' | 'value' | 'gasPrice';
type SortDirection = 'asc' | 'desc';
type FilterType = 'all' | 'send' | 'receive' | 'contract' | 'pending' | 'success' | 'failed';

export function TransactionHistoryTable({
  transactions,
  isLoading,
  emptyMessage = 'No transactions found',
}: TransactionHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { toast } = useToast();

  // Filter and sort transactions
  const filteredAndSortedTxs = useMemo(() => {
    let filtered = [...transactions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.hash.toLowerCase().includes(query) ||
          tx.from.toLowerCase().includes(query) ||
          tx.to?.toLowerCase().includes(query)
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      if (['send', 'receive', 'contract'].includes(filterType)) {
        filtered = filtered.filter((tx) => tx.type === filterType);
      } else {
        filtered = filtered.filter((tx) => tx.status === filterType);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'timestamp':
          comparison = a.timestamp - b.timestamp;
          break;
        case 'value':
          comparison = Number(a.value - b.value);
          break;
        case 'gasPrice':
          comparison = Number(a.gasPrice - b.gasPrice);
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [transactions, searchQuery, filterType, sortField, sortDirection]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast({
      title: 'Copied!',
      description: 'Transaction hash copied to clipboard',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500 animate-pulse" />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'receive':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />;
      case 'send':
        return <ArrowUpRight className="h-4 w-4 text-blue-500" />;
      case 'contract':
        return <FileCode className="h-4 w-4 text-purple-500" />;
      default:
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string, status: string) => {
    if (status === 'pending') {
      return <Badge variant="outline">Pending</Badge>;
    }

    switch (type) {
      case 'receive':
        return <Badge className="bg-green-500 hover:bg-green-600">Received</Badge>;
      case 'send':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Sent</Badge>;
      case 'contract':
        return <Badge variant="secondary">Contract</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const explorerUrl = andechain.blockExplorers?.default?.url;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Loading your transaction history...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>
              {filteredAndSortedTxs.length} transaction{filteredAndSortedTxs.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by hash or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="send">Sent</SelectItem>
              <SelectItem value="receive">Received</SelectItem>
              <SelectItem value="contract">Contract Calls</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredAndSortedTxs.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <ArrowUpRight className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table Header - Desktop Only */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 py-2 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-1">Type</div>
              <div className="col-span-3">Hash</div>
              <div className="col-span-2">From/To</div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => toggleSort('value')}>
                Value
                <ArrowUpDown className="h-3 w-3" />
              </div>
              <div className="col-span-2 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => toggleSort('gasPrice')}>
                Gas Price
                <ArrowUpDown className="h-3 w-3" />
              </div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1 flex items-center gap-1 cursor-pointer hover:text-foreground" onClick={() => toggleSort('timestamp')}>
                Age
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </div>

            {/* Transaction Rows */}
            {filteredAndSortedTxs.map((tx) => (
              <div
                key={tx.hash}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                {/* Type Icon */}
                <div className="hidden md:flex md:col-span-1 items-center">
                  {getTypeIcon(tx.type || 'send')}
                </div>

                {/* Hash */}
                <div className="col-span-1 md:col-span-3 flex items-center gap-2">
                  <div className="flex md:hidden">{getTypeIcon(tx.type || 'send')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono truncate">{formatAddress(tx.hash)}</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => handleCopyHash(tx.hash)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {explorerUrl && (
                        <a
                          href={`${explorerUrl}/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-6 w-6 inline-flex items-center justify-center hover:bg-accent rounded-md"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* From/To */}
                <div className="col-span-1 md:col-span-2 space-y-1">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">From:</span>
                    <code className="font-mono">{formatAddress(tx.from)}</code>
                  </div>
                  {tx.to && (
                    <div className="flex items-center gap-1 text-xs">
                      <span className="text-muted-foreground">To:</span>
                      <code className="font-mono">{formatAddress(tx.to)}</code>
                    </div>
                  )}
                  {!tx.to && (
                    <div className="text-xs text-muted-foreground italic">Contract Creation</div>
                  )}
                </div>

                {/* Value */}
                <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-semibold">
                      {parseFloat(tx.valueFormatted).toFixed(6)}
                    </span>
                    <span className="text-xs text-muted-foreground">{tx.tokenSymbol || 'ANDE'}</span>
                  </div>
                </div>

                {/* Gas Price */}
                <div className="col-span-1 md:col-span-2 flex flex-col justify-center">
                  <div className="text-sm font-mono">{tx.gasPriceGwei} Gwei</div>
                  {tx.gasUsed && (
                    <div className="text-xs text-muted-foreground">
                      Gas: {tx.gasUsed.toString()}
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="col-span-1 md:col-span-1 flex items-center gap-2">
                  {getStatusIcon(tx.status)}
                  <span className="md:hidden">{getTypeBadge(tx.type || 'send', tx.status)}</span>
                </div>

                {/* Age */}
                <div className="col-span-1 md:col-span-1 flex items-center">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}