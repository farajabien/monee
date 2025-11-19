"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { DebtWithUser } from "@/types";

export function DebtProgress() {
  const user = db.useUser();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = new Date(currentYear, currentMonth - 1, 1).getTime();
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).getTime();

  const { isLoading, error, data } = db.useQuery({
    debts: {
      $: {
        where: { "user.id": user.id },
      },
      user: {},
    },
    debt_payments: {
      $: {
        where: {
          paymentDate: { $gte: monthStart, $lte: monthEnd },
        },
      },
      debt: {},
    },
  });

  const totalDebt = useMemo(
    () =>
      (data?.debts || []).reduce((sum, debt) => sum + debt.currentBalance, 0),
    [data?.debts]
  );

  const totalMonthlyPayments = useMemo(
    () =>
      (data?.debt_payments || []).reduce(
        (sum, payment) => sum + payment.amount,
        0
      ),
    [data?.debt_payments]
  );

  const debts: DebtWithUser[] = data?.debts || [];

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalPaid = (debt: DebtWithUser) => {
    return debt.totalAmount - debt.currentBalance;
  };

  const calculatePayoffMonths = (debt: DebtWithUser) => {
    if (debt.monthlyPaymentAmount === 0) return null;
    return Math.ceil(debt.currentBalance / debt.monthlyPaymentAmount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading debt progress...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  if (debts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Debt Progress -{" "}
          {now.toLocaleString("default", { month: "long", year: "numeric" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Total Debt</div>
            <div className="text-2xl font-bold">{formatAmount(totalDebt)}</div>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">
              This Month&apos;s Payments
            </div>
            <div className="text-2xl font-bold">
              {formatAmount(totalMonthlyPayments)}
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t">
          <h3 className="text-sm font-medium">Debt Breakdown</h3>
          {debts.map((debt) => {
            const paid = calculateTotalPaid(debt);
            const progress = (paid / debt.totalAmount) * 100;
            const payoffMonths = calculatePayoffMonths(debt);

            return (
              <div key={debt.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{debt.name}</span>
                  <span>{formatAmount(debt.currentBalance)} remaining</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{progress.toFixed(1)}% paid off</span>
                  {payoffMonths && (
                    <span>
                      {payoffMonths} month{payoffMonths !== 1 ? "s" : ""} to go
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
