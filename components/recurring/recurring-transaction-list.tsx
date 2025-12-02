"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecurringTransactionForm } from "./recurring-transaction-form";
import { Plus, Edit, Trash2, Check, X } from "lucide-react";
import type { RecurringTransaction } from "@/lib/recurring-transaction-matcher";
import { useCurrency } from "@/hooks/use-currency";

export function RecurringTransactionList() {
  const user = db.useUser();
  const [showDialog, setShowDialog] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<RecurringTransaction | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      recurringTransactions: {
        $: {
          order: { createdAt: "desc" },
        },
      },
      categories: {},
    },
  });

  const profile = data?.profiles?.[0];
  const recurringTransactions = profile?.recurringTransactions || [];
  const categories = profile?.categories || [];

  const { formatCurrency } = useCurrency(profile?.currency, profile?.locale);

  // Group by active/inactive
  const { active, inactive } = useMemo(() => {
    return {
      active: recurringTransactions.filter((t) => t.isActive),
      inactive: recurringTransactions.filter((t) => !t.isActive),
    };
  }, [recurringTransactions]);

  const handleDelete = async (id: string) => {
    try {
      await db.transact(db.tx.recurring_transactions[id].delete());
      setDeleteConfirm(null);
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  const handleToggleActive = async (transaction: RecurringTransaction) => {
    try {
      await db.transact(
        db.tx.recurring_transactions[transaction.id].update({
          isActive: !transaction.isActive,
        })
      );
    } catch (error) {
      console.error("Error toggling transaction status:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const handleEdit = (transaction: RecurringTransaction) => {
    setEditingTransaction(transaction);
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingTransaction(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Recurring Transactions</h2>
          <p className="text-sm text-muted-foreground">
            Set up recurring payments to automatically match future transactions
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Recurring Transaction
        </Button>
      </div>

      {/* Empty State */}
      {recurringTransactions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Plus className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-2">
              No recurring transactions yet
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              Add your recurring payments like rent, subscriptions, and utilities
              to automatically match them with your M-PESA transactions.
            </p>
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Transaction
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Active Transactions */}
      {active.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            Active Transactions
            <Badge variant="secondary">{active.length}</Badge>
          </h3>
          <div className="grid gap-4">
            {active.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                formatCurrency={formatCurrency}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirm(id)}
                onToggleActive={handleToggleActive}
                deleteConfirm={deleteConfirm}
                onCancelDelete={() => setDeleteConfirm(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive Transactions */}
      {inactive.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-muted-foreground">
            Inactive Transactions
            <Badge variant="outline">{inactive.length}</Badge>
          </h3>
          <div className="grid gap-4 opacity-60">
            {inactive.map((transaction) => (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                formatCurrency={formatCurrency}
                onEdit={handleEdit}
                onDelete={(id) => setDeleteConfirm(id)}
                onToggleActive={handleToggleActive}
                deleteConfirm={deleteConfirm}
                onCancelDelete={() => setDeleteConfirm(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction
                ? "Edit Recurring Transaction"
                : "Add Recurring Transaction"}
            </DialogTitle>
            <DialogDescription>
              Set up automatic matching for recurring payments like rent,
              subscriptions, and utilities.
            </DialogDescription>
          </DialogHeader>
          <RecurringTransactionForm
            recurringTransaction={editingTransaction}
            categories={categories}
            onSuccess={handleCloseDialog}
            onCancel={handleCloseDialog}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Transaction Card Component
interface TransactionCardProps {
  transaction: RecurringTransaction;
  formatCurrency: (amount: number) => string;
  onEdit: (transaction: RecurringTransaction) => void;
  onDelete: (id: string) => void;
  onToggleActive: (transaction: RecurringTransaction) => void;
  deleteConfirm: string | null;
  onCancelDelete: () => void;
}

function TransactionCard({
  transaction,
  formatCurrency,
  onEdit,
  onDelete,
  onToggleActive,
  deleteConfirm,
  onCancelDelete,
}: TransactionCardProps) {
  const isDeleting = deleteConfirm === transaction.id;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <CardTitle className="text-lg">{transaction.name}</CardTitle>
              <Badge variant={transaction.isActive ? "default" : "secondary"}>
                {transaction.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <CardDescription>
              {transaction.recipient} • {transaction.category}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{formatCurrency(transaction.amount)}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {transaction.frequency}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-3">
          {/* Payment Details */}
          {(transaction.paybillNumber ||
            transaction.tillNumber ||
            transaction.accountNumber) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {transaction.paybillNumber && (
                <Badge variant="outline">
                  Paybill: {transaction.paybillNumber}
                </Badge>
              )}
              {transaction.tillNumber && (
                <Badge variant="outline">Till: {transaction.tillNumber}</Badge>
              )}
              {transaction.accountNumber && (
                <Badge variant="outline">
                  Account: {transaction.accountNumber}
                </Badge>
              )}
            </div>
          )}

          {/* Actions */}
          {!isDeleting ? (
            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onToggleActive(transaction)}
              >
                {transaction.isActive ? (
                  <>
                    <X className="h-3 w-3 mr-1" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(transaction)}
              >
                <Edit className="h-3 w-3 mr-1" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(transaction.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pt-2 bg-red-50 dark:bg-red-950/20 p-3 rounded-md">
              <p className="text-sm flex-1">
                Are you sure you want to delete this recurring transaction?
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={onCancelDelete}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(transaction.id)}
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
