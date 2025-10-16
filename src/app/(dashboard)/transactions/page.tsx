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
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

const transactions = [
  {
    hash: "0xabc...def",
    type: "Send",
    amount: "10.5 AND",
    from: "0x123...456",
    to: "0x789...abc",
    status: "Completed",
    date: "2024-05-20",
  },
  {
    hash: "0x123...ghi",
    type: "Receive",
    amount: "50.0 AND",
    from: "0xabc...def",
    to: "0x123...456",
    status: "Completed",
    date: "2024-05-19",
  },
  {
    hash: "0xjkl...mno",
    type: "Send",
    amount: "2.1 AND",
    from: "0x123...456",
    to: "0xghi...jkl",
    status: "Pending",
    date: "2024-05-21",
  },
  {
    hash: "0xpqr...stu",
    type: "Staking",
    amount: "100.0 AND",
    from: "0x123...456",
    to: "Staking Contract",
    status: "Completed",
    date: "2024-05-18",
  },
];

export default function TransactionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction History</CardTitle>
        <CardDescription>
          A log of all your recent blockchain transactions.
        </CardDescription>
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
            {transactions.map((tx) => (
              <TableRow key={tx.hash}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {tx.type === "Send" ? (
                      <span className="p-1.5 bg-muted rounded-full">
                        <ArrowUpRight className="h-4 w-4 text-red-500" />
                      </span>
                    ) : (
                      <span className="p-1.5 bg-muted rounded-full">
                        <ArrowDownLeft className="h-4 w-4 text-green-500" />
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
                  <Badge
                    variant={
                      tx.status === "Completed"
                        ? "default"
                        : tx.status === "Pending"
                        ? "secondary"
                        : "destructive"
                    }
                    className={
                      tx.status === "Completed"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                        : tx.status === "Pending"
                        ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                        : ""
                    }
                  >
                    {tx.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{tx.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
