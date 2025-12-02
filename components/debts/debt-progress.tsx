"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import { CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Debt = {
  id: string;
  createdAt: number;
  name: string;
  totalAmount: number;
  currentBalance: number;
  monthlyPaymentAmount: number;
  paymentDueDay: number;
  deadline?: number;
  interestRate?: number;
  pushMonthsPlan?: number;
  pushMonthsCompleted?: number;
  lastInterestPaymentDate?: number;
  interestAccrued?: number;
};

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
    return debt.totalAmount - debt.currentBalance;
  };

  const calculatePayoffMonths = (debt: Debt) => {
    if (debt.monthlyPaymentAmount === 0) return null;
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

      <div className="pt-4 border-t">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="individual">Individual Debts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-3 mt-4">
            <h3 className="text-sm font-medium">Debt Breakdown</h3>
            {debts.map((debt) => {
              const paid = calculateTotalPaid(debt);
              const progress = (paid / debt.totalAmount) * 100;
              const payoffMonths = calculatePayoffMonths(debt);

              return (
                <div key={debt.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{debt.name}</span>
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
                        {payoffMonths} month{payoffMonths !== 1 ? "s" : ""} to
                        go
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </TabsContent>

          <TabsContent value="individual" className="space-y-4 mt-4">
            {debts.map((debt) => {
              const paid = calculateTotalPaid(debt);
              const progress = (paid / debt.totalAmount) * 100;
              const payoffMonths = calculatePayoffMonths(debt);
              const monthlyInterest =
                debt.interestRate && debt.currentBalance
                  ? debt.currentBalance * (debt.interestRate / 100)
                  : 0;
              const remainingPushMonths = debt.pushMonthsPlan
                ? Math.max(
                    0,
                    debt.pushMonthsPlan - (debt.pushMonthsCompleted || 0)
                  )
                : null;
              const projectedInterest =
                debt.pushMonthsPlan && monthlyInterest > 0
                  ? monthlyInterest * debt.pushMonthsPlan
                  : null;

              return (
                <div key={debt.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{debt.name}</h4>
                      {debt.pushMonthsPlan && (
                        <Badge variant="outline" className="text-xs">
                          Push Strategy
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm font-medium">
                      {formatAmount(debt.currentBalance)} remaining
                    </span>
                  </div>

                  <Progress value={progress} className="h-2" />

                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.toFixed(1)}% paid off</span>
                    {payoffMonths && (
                      <span>
                        {payoffMonths} month{payoffMonths !== 1 ? "s" : ""} to
                        go
                      </span>
                    )}
                  </div>

                  {debt.pushMonthsPlan && (
                    <div className="pt-2 space-y-1 border-t">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">
                          Push Progress:
                        </span>
                        <span>
                          {debt.pushMonthsCompleted || 0} /{" "}
                          {debt.pushMonthsPlan} months
                        </span>
                      </div>
                      {remainingPushMonths !== null &&
                        remainingPushMonths > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">
                              Remaining:
                            </span>
                            <span>
                              {remainingPushMonths} month
                              {remainingPushMonths !== 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      {debt.interestAccrued && debt.interestAccrued > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Interest Paid:
                          </span>
                          <span className="text-amber-600">
                            {formatAmount(debt.interestAccrued)}
                          </span>
                        </div>
                      )}
                      {projectedInterest && (
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">
                            Projected Total Interest:
                          </span>
                          <span className="text-amber-600">
                            {formatAmount(projectedInterest)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
