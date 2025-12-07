"use client";

import { useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingDown, Percent, CreditCard } from "lucide-react";
import { useCurrency } from "@/hooks/use-currency";
import type { DebtWithPayments } from "@/types";

interface DebtDetailsSheetProps {
  debt: DebtWithPayments | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebtDetailsSheet({
  debt,
  open,
  onOpenChange,
}: DebtDetailsSheetProps) {
  const { formatCurrency } = useCurrency();

  const calculations = useMemo(() => {
    if (!debt) return null;

    const totalPaid = debt.payments?.reduce((sum, p) => sum + p.amount, 0) || 0;
    const remaining = debt.currentBalance;
    const percentPaid = debt.debtTaken
      ? ((debt.debtTaken - debt.currentBalance) / debt.debtTaken) * 100
      : 0;
    const avgPayment =
      debt.payments && debt.payments.length > 0
        ? totalPaid / debt.payments.length
        : 0;

    return {
      totalPaid,
      remaining,
      percentPaid,
      avgPayment,
    };
  }, [debt]);

  if (!debt) return null;

  const getDebtTypeBadge = () => {
    const variants = {
      "one-time": "default",
      "interest-push": "secondary",
      amortizing: "outline",
    } as const;

    const debtType =
      debt.repaymentTerms?.toLowerCase().replace(/\s+/g, "-") || "one-time";

    return (
      <Badge variant={variants[debtType as keyof typeof variants] || "default"}>
        {debt.repaymentTerms || "One-time"}
      </Badge>
    );
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPaymentDay = (day: number) => {
    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
        ? "nd"
        : day === 3 || day === 23
        ? "rd"
        : "th";
    return `${day}${suffix} of each month`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {debt.debtor || "Debt"}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Overview Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Debt</p>
              <p className="text-2xl font-bold">
                {formatCurrency(debt.debtTaken || 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Remaining</p>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(calculations?.remaining || 0)}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">
                {calculations?.percentPaid.toFixed(1)}% paid
              </span>
            </div>
            <Progress value={calculations?.percentPaid || 0} className="h-2" />
          </div>

          {/* Payment Information */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Debt Type</span>
                {getDebtTypeBadge()}
              </div>
              {debt.monthlyPaymentAmount && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Monthly Payment
                  </span>
                  <span className="font-semibold">
                    {formatCurrency(debt.monthlyPaymentAmount)}
                  </span>
                </div>
              )}
              {debt.paymentDueDay && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Payment Due</span>
                  </div>
                  <span className="font-medium">
                    {formatPaymentDay(debt.paymentDueDay)}
                  </span>
                </div>
              )}
              {debt.deadline && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Deadline
                  </span>
                  <span className="font-medium">
                    {formatDate(debt.deadline)}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interest Details */}
          {debt.interestRate && debt.interestRate > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Interest Details</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Annual Rate
                  </span>
                  <span className="font-semibold">{debt.interestRate}%</span>
                </div>
                {debt.compoundingFrequency && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Compounding
                    </span>
                    <span className="font-medium capitalize">
                      {debt.compoundingFrequency}
                    </span>
                  </div>
                )}
                {debt.interestAccrued !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Accrued Interest
                    </span>
                    <span className="font-semibold">
                      {formatCurrency(debt.interestAccrued)}
                    </span>
                  </div>
                )}
                {debt.lastInterestPaymentDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Last Interest Payment
                    </span>
                    <span className="text-sm">
                      {formatDate(debt.lastInterestPaymentDate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Push Plan Details */}
          {debt.repaymentTerms === "Interest Push" && debt.pushMonthsPlan && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold">Interest Push Plan</h3>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Plan Duration
                  </span>
                  <span className="font-medium">
                    {debt.pushMonthsPlan} months
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Months Completed
                  </span>
                  <span className="font-medium">
                    {debt.pushMonthsCompleted || 0}
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {(
                        ((debt.pushMonthsCompleted || 0) /
                          debt.pushMonthsPlan) *
                        100
                      ).toFixed(1)}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      ((debt.pushMonthsCompleted || 0) / debt.pushMonthsPlan) *
                      100
                    }
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Statistics */}
          {debt.payments && debt.payments.length > 0 && (
            <Card>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-semibold">Payment Statistics</h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Paid
                  </span>
                  <span className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(calculations?.totalPaid || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Payments
                  </span>
                  <span className="font-medium">{debt.payments.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Average Payment
                  </span>
                  <span className="font-medium">
                    {formatCurrency(calculations?.avgPayment || 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {debt.payments && debt.payments.length > 0 && (
            <div>
              <h3 className="font-semibold mb-3">Payment History</h3>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {debt.payments
                  .sort((a, b) => b.paymentDate - a.paymentDate)
                  .map((payment) => (
                    <Card key={payment.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold">
                            {formatCurrency(payment.amount)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(payment.paymentDate)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <Badge variant="outline" className="text-xs">
                            {payment.paymentType}
                          </Badge>
                          {payment.principalAmount !== undefined && (
                            <span>
                              Principal:{" "}
                              {formatCurrency(payment.principalAmount)}
                            </span>
                          )}
                          {payment.interestAmount !== undefined && (
                            <span>
                              Interest: {formatCurrency(payment.interestAmount)}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!debt.payments || debt.payments.length === 0) && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>No payments recorded yet</p>
              </CardContent>
            </Card>
          )}

          {/* Created Date */}
          <div className="text-sm text-muted-foreground text-center pt-4 border-t">
            Created on {formatDate(debt.createdAt)}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
