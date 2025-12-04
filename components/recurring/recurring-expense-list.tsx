"use client";

import { useState } from "react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, MoreVertical, Pause, Play, Edit, AlertCircle, History } from "lucide-react";
import { toast } from "sonner";
import { useCurrency } from "@/hooks/use-currency";
import { RecurringPaymentDialog } from "./recurring-payment-dialog";
import { PaymentHistoryDialog } from "./payment-history-dialog";
import type { RecurringTransaction } from "@/types";

interface RecurringExpenseListProps {
  profileId: string;
}

export function RecurringExpenseList({ profileId }: RecurringExpenseListProps) {
  const { formatCurrency } = useCurrency();
  const [currentTime] = useState(() => Date.now());
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "paused">("active");
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    transaction: RecurringTransaction | null;
  }>({ open: false, transaction: null });
  const [historyDialog, setHistoryDialog] = useState<{
    open: boolean;
    transaction: RecurringTransaction | null;
  }>({ open: false, transaction: null });

  // Fetch recurring transactions
  const { data, isLoading } = db.useQuery({
    recurring_transactions: {
      $: {
        where: { "profile.id": profileId },
        order: { nextDueDate: "asc" },
      },
    },
  });

  const recurringTransactions = data?.recurring_transactions || [];

  // Filter based on status
  const filteredTransactions = recurringTransactions.filter((t) => {
    if (filterStatus === "all") return true;
    if (filterStatus === "active") return !t.isPaused && t.isActive;
    if (filterStatus === "paused") return t.isPaused || !t.isActive;
    return true;
  });

  // Toggle pause state
  const handleTogglePause = async (transaction: RecurringTransaction) => {
    try {
      await db.transact(
        db.tx.recurring_transactions[transaction.id].update({
          isPaused: !transaction.isPaused,
        })
      );
      toast.success(transaction.isPaused ? "Resumed" : "Paused");
    } catch (error) {
      console.error("Error toggling pause:", error);
      toast.error("Failed to update status");
    }
  };

  // Check if due soon (within 7 days)
  const isDueSoon = (dueDate?: number) => {
    if (!dueDate) return false;
    const daysUntilDue = (dueDate - currentTime) / (1000 * 60 * 60 * 24);
    return daysUntilDue >= 0 && daysUntilDue <= 7;
  };

  // Check if overdue
  const isOverdue = (dueDate?: number) => {
    if (!dueDate) return false;
    return dueDate < currentTime;
  };

  // Format frequency for display
  const formatFrequency = (freq: string) => {
    const map: Record<string, string> = {
      weekly: "Weekly",
      biweekly: "Bi-weekly",
      monthly: "Monthly",
      quarterly: "Quarterly",
      annually: "Annually",
    };
    return map[freq] || freq;
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading recurring expenses...</div>;
  }

  if (filteredTransactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No recurring expenses found.
          {filterStatus !== "all" && " Try changing the filter."}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <Button
          variant={filterStatus === "active" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilterStatus("active")}
        >
          Active
        </Button>
        <Button
          variant={filterStatus === "paused" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilterStatus("paused")}
        >
          Paused
        </Button>
        <Button
          variant={filterStatus === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => setFilterStatus("all")}
        >
          All
        </Button>
      </div>

      {/* Recurring Expenses List */}
      <div className="grid gap-3">
        {filteredTransactions.map((transaction) => {
          const dueSoon = isDueSoon(transaction.nextDueDate);
          const overdue = isOverdue(transaction.nextDueDate);

          return (
            <Card
              key={transaction.id}
              className={`transition-colors ${
                overdue
                  ? "border-destructive/50 bg-destructive/5"
                  : dueSoon
                  ? "border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{transaction.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {transaction.recipient}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          setPaymentDialog({ open: true, transaction })
                        }
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Record Payment
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          setHistoryDialog({ open: true, transaction })
                        }
                      >
                        <History className="h-4 w-4 mr-2" />
                        Payment History
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTogglePause(transaction)}>
                        {transaction.isPaused ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </>
                        ) : (
                          <>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Amount and Category */}
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-base font-semibold">
                      {formatCurrency(transaction.amount)}
                    </Badge>
                    <Badge variant="outline">{transaction.category}</Badge>
                  </div>

                  {/* Due Date and Frequency */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span>{formatFrequency(transaction.frequency)}</span>
                      {overdue && (
                        <div className="flex items-center gap-1 text-destructive font-medium">
                          <AlertCircle className="h-3 w-3" />
                          Overdue
                        </div>
                      )}
                      {dueSoon && !overdue && (
                        <div className="flex items-center gap-1 text-yellow-600 dark:text-yellow-500 font-medium">
                          <AlertCircle className="h-3 w-3" />
                          Due Soon
                        </div>
                      )}
                    </div>
                    {transaction.nextDueDate && (
                      <span className="text-muted-foreground">
                        Next: {new Date(transaction.nextDueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Mark as Paid Button */}
                  {!transaction.isPaused && transaction.isActive && (
                    <Button
                      onClick={() => setPaymentDialog({ open: true, transaction })}
                      className="w-full"
                      variant={overdue || dueSoon ? "default" : "outline"}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}

                  {transaction.isPaused && (
                    <div className="text-center py-2 text-sm text-muted-foreground">
                      Paused
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Dialogs */}
      {paymentDialog.transaction && (
        <RecurringPaymentDialog
          open={paymentDialog.open}
          onOpenChange={(open) =>
            setPaymentDialog({ ...paymentDialog, open })
          }
          transaction={paymentDialog.transaction}
          profileId={profileId}
        />
      )}
      {historyDialog.transaction && (
        <PaymentHistoryDialog
          open={historyDialog.open}
          onOpenChange={(open) =>
            setHistoryDialog({ ...historyDialog, open })
          }
          transaction={historyDialog.transaction}
        />
      )}
    </div>
  );
}
