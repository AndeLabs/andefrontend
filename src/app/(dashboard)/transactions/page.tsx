
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, ArrowDownLeft, PlusCircle, CheckCircle, Clock, XCircle, Landmark, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactionHistory, type Transaction } from "@/hooks/use-transaction-history";
import { useAccount } from "wagmi";
import { useEffect, useState } from "react";

export default function TransactionsPage() {
  const { address } = useAccount();
  const { transactions, addTransaction, removeTransaction, clearHistory, isLoading } = useTransactionHistory();
  const [mounted, setMounted] = useState(false);

  // Prevenir hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const createSampleTransaction = () => {
    if (!address) return;

    const types = ['Send', 'Receive', 'Staking'] as const;
    const statuses = ['success', 'pending', 'failed'] as const;
    
    const sampleTx: Omit<Transaction, 'id' | 'timestamp'> = {
      hash: "0x" + Math.random().toString(16).substr(2, 8) + "..." + Math.random().toString(16).substr(2, 8),
      type: types[Math.floor(Math.random() * types.length)],
      value: `${(Math.random() * 100).toFixed(2)} ANDE`,
      from: address.substring(0, 6) + "..." + address.substring(address.length - 4),
      to: "0x" + Math.random().toString(16).substr(2, 3) + "..." + Math.random().toString(16).substr(2, 3),
      status: statuses[Math.floor(Math.random() * statuses.length)],
    };
    
    addTransaction(sampleTx);
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return '...';
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'success':
        return <Badge variant="secondary" className="bg-green-600/10 text-green-400 border-green-400/20"><CheckCircle className="mr-1 h-3 w-3" />Success</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-600/10 text-yellow-400 border-yellow-400/20"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };
  
  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case "Send":
        return (
          <span className="p-1.5 bg-red-500/10 rounded-full">
            <ArrowUpRight className="h-4 w-4 text-red-400" />
          </span>
        );
      case "Receive":
        return (
          <span className="p-1.5 bg-green-500/10 rounded-full">
            <ArrowDownLeft className="h-4 w-4 text-green-400" />
          </span>
        );
      case "Staking":
        return (
          <span className="p-1.5 bg-blue-500/10 rounded-full">
            <Landmark className="h-4 w-4 text-blue-400" />
          </span>
        );
      default:
        return null;
    }
  };

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A log of all your recent blockchain transactions (stored locally).
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button onClick={createSampleTransaction} variant="outline" size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Sample TX
          </Button>
          {transactions.length > 0 && (
            <Button onClick={clearHistory} variant="outline" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead className="hidden md:table-cell">From</TableHead>
              <TableHead className="hidden md:table-cell">To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={7}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && transactions && transactions.length > 0 && transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTypeIcon(tx.type)}
                    <span className="font-medium">{tx.type}</span>
                  </div>
                </TableCell>
                <TableCell>{tx.value}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">
                  {tx.from}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">
                  {tx.to}
                </TableCell>
                <TableCell>
                  {getStatusBadge(tx.status)}
                </TableCell>
                <TableCell className="text-right text-sm">{formatDate(tx.timestamp)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTransaction(tx.id)}
                    className="h-8 w-8 p-0 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!isLoading && (!transactions || transactions.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No transactions found. Your transaction history will appear here.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
