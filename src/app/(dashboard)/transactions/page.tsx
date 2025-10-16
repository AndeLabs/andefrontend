
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
import { ArrowUpRight, ArrowDownLeft, PlusCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

type Transaction = {
  id?: string;
  hash: string;
  type: "Send" | "Receive" | "Staking";
  amount: string;
  from: string;
  to: string;
  status: "Completed" | "Pending" | "Failed";
  timestamp: any;
};

export default function TransactionsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsRef = useMemoFirebase(() => {
    if (!user) return null;
    return collection(firestore, `transactions/${user.uid}`);
  }, [user, firestore]);

  const { data: transactions, isLoading } = useCollection<Transaction>(transactionsRef);

  const createSampleTransaction = () => {
    if (!transactionsRef) return;
    const sampleTx: Omit<Transaction, 'id' | 'timestamp'> = {
      hash: "0x" + Math.random().toString(16).substr(2, 8) + "..." + Math.random().toString(16).substr(2, 8),
      type: ["Send", "Receive", "Staking"][Math.floor(Math.random() * 3)] as Transaction['type'],
      amount: `${(Math.random() * 100).toFixed(2)} AND`,
      from: user?.uid.substring(0, 6) + "..." + user?.uid.substring(user.uid.length - 4) || "0x123...456",
      to: "0x" + Math.random().toString(16).substr(2, 3) + "..." + Math.random().toString(16).substr(2, 3),
      status: ["Completed", "Pending", "Failed"][Math.floor(Math.random() * 3)] as Transaction['status'],
    };
    
    addDocumentNonBlocking(transactionsRef, {
      ...sampleTx,
      timestamp: serverTimestamp(),
    });
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '...';
    if (timestamp?.toDate) {
      return timestamp.toDate().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    }
    return new Date(timestamp).toLocaleDateString();
  }

  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'Completed':
        return <Badge variant="secondary" className="bg-green-100/10 text-green-400 border-green-400/20"><CheckCircle className="mr-1 h-3 w-3" />{status}</Badge>;
      case 'Pending':
        return <Badge variant="secondary" className="bg-yellow-100/10 text-yellow-400 border-yellow-400/20"><Clock className="mr-1 h-3 w-3" />{status}</Badge>;
      case 'Failed':
        return <Badge variant="destructive"><XCircle className="mr-1 h-3 w-3" />{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            A log of all your recent blockchain transactions.
          </CardDescription>
        </div>
        <Button onClick={createSampleTransaction} variant="outline" size="sm">
          <PlusCircle className="mr-2" />
          Add Sample TX
        </Button>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            )}
            {!isLoading && transactions && transactions.length > 0 && [...transactions].sort((a,b) => (b.timestamp?.seconds ?? 0) - (a.timestamp?.seconds ?? 0)).map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {tx.type === "Send" ? (
                      <span className="p-1.5 bg-red-500/10 rounded-full">
                        <ArrowUpRight className="h-4 w-4 text-red-400" />
                      </span>
                    ) : tx.type === "Receive" ? (
                      <span className="p-1.5 bg-green-500/10 rounded-full">
                        <ArrowDownLeft className="h-4 w-4 text-green-400" />
                      </span>
                    ) : (
                       <span className="p-1.5 bg-blue-500/10 rounded-full">
                        <ArrowUpRight className="h-4 w-4 text-blue-400" />
                      </span>
                    )}
                    <span className="font-medium">{tx.type}</span>
                  </div>
                </TableCell>
                <TableCell>{tx.amount}</TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">
                  {tx.from}
                </TableCell>
                <TableCell className="hidden md:table-cell font-mono text-xs">
                  {tx.to}
                </TableCell>
                <TableCell>
                  {getStatusBadge(tx.status)}
                </TableCell>
                <TableCell className="text-right">{formatDate(tx.timestamp)}</TableCell>
              </TableRow>
            ))}
             {!isLoading && (!transactions || transactions.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
