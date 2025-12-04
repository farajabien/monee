"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, DollarSign, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { useCurrency } from "@/hooks/use-currency";
import type { RecurringTransaction } from "@/types";

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: RecurringTransaction;
}

export function PaymentHistoryDialog({
  open,
  onOpenChange,
  transaction,
}: PaymentHistoryDialogProps) {
  const { formatCurrency } = useCurrency();

  // Fetch all expenses linked to this recurring transaction
  const { data, isLoading } = db.useQuery({
    expenses: {
      $: {
        where: {
          linkedRecurringId: transaction.id,
        },
        order: { date: "desc" },
      },
    },
  });

  const payments = useMemo(() => data?.expenses || [], [data?.expenses]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (payments.length === 0) {
      return {
        totalPaid: 0,
        averageAmount: 0,
        totalPayments: 0,
        advancePayments: 0,
      };
    }

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const advancePayments = payments.filter(
      (p) => p.parsedData?.advancePayment
    ).length;

    return {
      totalPaid,
      averageAmount: totalPaid / payments.length,
      totalPayments: payments.length,
      advancePayments,
    };
  }, [payments]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Payment History</DialogTitle>
          <DialogDescription>
            {transaction.name} - {transaction.recipient}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Total Paid</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-lg font-bold">
                    {formatCurrency(stats.totalPaid)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Payments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <span className="text-lg font-bold">{stats.totalPayments}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Avg Amount</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                  <span className="text-lg font-bold">
                    {formatCurrency(stats.averageAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payment List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Payment Records</CardTitle>
              {stats.advancePayments > 0 && (
                <CardDescription>
                  Includes {stats.advancePayments} advance payment
                  {stats.advancePayments !== 1 ? "s" : ""}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">
                  Loading payment history...
                </div>
              ) : payments.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  No payments recorded yet
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="divide-y">
                    {payments.map((payment) => {
                      const isAdvance = payment.parsedData?.advancePayment;
                      const paymentIndex = payment.parsedData?.paymentIndex;
                      const totalPayments = payment.parsedData?.totalPayments;

                      return (
                        <div
                          key={payment.id}
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">
                                  {format(payment.date || payment.createdAt, "PPP")}
                                </span>
                                {isAdvance && (
                                  <Badge variant="secondary" className="text-xs">
                                    Advance {paymentIndex}/{totalPayments}
                                  </Badge>
                                )}
                              </div>
                              {payment.notes && (
                                <p className="text-sm text-muted-foreground">
                                  {payment.notes}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {format(payment.createdAt, "PPp")}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-green-600">
                                {formatCurrency(payment.amount)}
                              </div>
                              {payment.amount !== transaction.amount && (
                                <p className="text-xs text-muted-foreground">
                                  (Expected: {formatCurrency(transaction.amount)})
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>

          {/* Upcoming Due Date */}
          {transaction.nextDueDate && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Next Due Date</span>
                  </div>
                  <span className="font-semibold">
                    {format(transaction.nextDueDate, "PPP")}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
