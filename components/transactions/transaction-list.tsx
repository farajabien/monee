"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { EditTransactionDialog } from "./edit-transaction-dialog";
import type { Transaction } from "@/types";

export default function TransactionList() {
  const user = db.useUser();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { isLoading, error, data } = db.useQuery({
    transactions: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
        limit: 50,
      },
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            Error: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.transactions || [];

  const deleteTransaction = (transactionId: string) => {
    db.transact(db.tx.transactions[transactionId].delete());
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-KE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            No transactions yet. Add your first Mpesa message above!
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {transactions.map((transaction: Transaction) => (
        <Card key={transaction.id}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">
                    {formatAmount(transaction.amount)}
                  </span>
                  {transaction.category && (
                    <Badge variant="secondary">{transaction.category}</Badge>
                  )}
                </div>
                {transaction.recipient && (
                  <p className="text-sm text-muted-foreground">
                    To: {transaction.recipient}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formatDate(transaction.date || transaction.createdAt)}
                </p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingTransaction(transaction);
                    setIsEditDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteTransaction(transaction.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>

      <EditTransactionDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        transaction={editingTransaction}
      />
    </>
  );
}

