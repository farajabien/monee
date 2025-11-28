"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface DebtInfo {
  id: string;
  name: string;
  nextPaymentAmount: number;
  nextPaymentDate: number;
  totalOwed: number;
}

interface DebtsAlertCardProps {
  debts: DebtInfo[];
  isLoading?: boolean;
}

export function DebtsAlertCard({ debts, isLoading = false }: DebtsAlertCardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (timestamp: number) => {
    const today = new Date();
    const targetDate = new Date(timestamp);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalOwed = debts.reduce((sum, debt) => sum + debt.totalOwed, 0);

  // Find next payment due
  const nextPayment = debts
    .filter((d) => d.nextPaymentDate > Date.now())
    .sort((a, b) => a.nextPaymentDate - b.nextPaymentDate)[0];

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Debts Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No debts case
  if (debts.length === 0) {
    return (
      <Card className="h-full bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
            Debts Alert
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No debts tracked yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You're debt-free! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const daysUntilPayment = nextPayment ? getDaysUntil(nextPayment.nextPaymentDate) : null;
  const isUrgent = daysUntilPayment !== null && daysUntilPayment <= 7;

  return (
    <Card className={`h-full ${isUrgent ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20" : ""}`}>
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <AlertCircle className={`h-4 w-4 ${isUrgent ? "text-orange-600" : ""}`} />
          Debts Alert
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nextPayment ? (
          <>
            {/* Next Payment Due */}
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">Next Payment</div>
              <div className="space-y-1">
                <div className="text-xl font-bold text-orange-600">
                  {formatAmount(nextPayment.nextPaymentAmount)}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Due:</span>{" "}
                  <span className="font-medium">
                    {formatDate(nextPayment.nextPaymentDate)}
                  </span>
                </div>
                {daysUntilPayment !== null && (
                  <div className="text-xs text-muted-foreground">
                    {daysUntilPayment === 0
                      ? "Due today!"
                      : daysUntilPayment === 1
                      ? "Due tomorrow"
                      : `${daysUntilPayment} days away`}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />
          </>
        ) : (
          <div className="text-sm text-muted-foreground">
            No upcoming payments scheduled
          </div>
        )}

        {/* Total Owed */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Total Owed</div>
          <div className="text-lg font-semibold">{formatAmount(totalOwed)}</div>
          <div className="text-xs text-muted-foreground">
            Across {debts.length} debt{debts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Action Button */}
        <Link href="/dashboard?tab=debts" className="block">
          <Button variant="outline" size="sm" className="w-full">
            View All Debts
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
