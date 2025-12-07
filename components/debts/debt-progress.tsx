"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import { CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Debt, DebtWithUser } from "@/types";

export function DebtProgress() {
  const user = db.useUser();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const monthStart = new Date(currentYear, currentMonth - 1, 1).getTime();
  const monthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59).getTime();

  const { isLoading, error, data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      debts: {
        $: {
          where: { "profile.user.id": user.id },
        },
      },
    },
    debt_payments: {
      $: {
        where: {
          paymentDate: { $gte: monthStart, $lte: monthEnd },
        },
      },
      debt: {
        $: {
          where: { "profile.user.id": user.id },
        },
      },
    },
  });

  const profile = data?.profiles?.[0];
  const debts = useMemo(() => profile?.debts || [], [profile?.debts]);

  const totalDebt = useMemo(
    () => debts.reduce((sum, debt) => sum + debt.currentBalance, 0),
    [debts]
  );

  const totalMonthlyPayments = useMemo(
    () =>
      (data?.debt_payments || []).reduce(
        (sum, payment) => sum + payment.amount,
        0
      ),
    [data?.debt_payments]
  );

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const calculateTotalPaid = (debt: Debt) => {
    return (debt.debtTaken || 0) - debt.currentBalance;
  };

  const calculatePayoffMonths = (debt: Debt) => {
    if (!debt.monthlyPaymentAmount || debt.monthlyPaymentAmount === 0)
      return null;
    return Math.ceil(debt.currentBalance / debt.monthlyPaymentAmount);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          Loading debt progress...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-500">Error: {error.message}</div>
      </div>
    );
  }

  if (debts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <CardTitle>
        Debt Progress -{" "}
        {now.toLocaleString("default", { month: "long", year: "numeric" })}
      </CardTitle>
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

      <h3 className="text-sm font-medium">Debt Breakdown</h3>
      {debts.map((debt) => {
        const paid = calculateTotalPaid(debt);
        const totalAmount = debt.debtTaken || 0;
        const progress = totalAmount > 0 ? (paid / totalAmount) * 100 : 0;
        const payoffMonths = calculatePayoffMonths(debt);

        return (
          <div key={debt.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{debt.debtor || "Unknown"}</span>
                {debt.pushMonthsPlan && (
                  <Badge variant="outline" className="text-xs">
                    Push Strategy
                  </Badge>
                )}
              </div>
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
  );
}
