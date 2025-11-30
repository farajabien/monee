"use client";

import { Item, ItemContent } from "@/components/ui/item";
import { AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useMemo } from "react";
import { useCurrency } from "@/hooks/use-currency";

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
  userCurrency?: string;
  userLocale?: string;
}

export function DebtsAlertCard({
  debts,
  isLoading = false,
  userCurrency,
  userLocale,
}: DebtsAlertCardProps) {
  const now = new Date();
  const { formatCurrency } = useCurrency(userCurrency, userLocale);

  const formatAmount = (amount: number) => {
    return formatCurrency(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntil = (timestamp: number) => {
    const today = new Date(now.getTime());
    const targetDate = new Date(timestamp);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const totalOwed = debts.reduce((sum, debt) => sum + debt.totalOwed, 0);

  // Find next payment due
  const nextPayment = debts
    .filter((d) => d.nextPaymentDate > now.getTime())
    .sort((a, b) => a.nextPaymentDate - b.nextPaymentDate)[0];

  if (isLoading) {
    return (
      <Item variant="outline" className="h-full border-0">
        <ItemContent>
          <div className="animate-pulse space-y-3 w-full">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </ItemContent>
      </Item>
    );
  }

  // No debts case
  if (debts.length === 0) {
    return (
      <Item variant="muted" className="h-full border-0">
        <ItemContent>
          <div className="text-center py-4 w-full">
            <p className="text-sm text-muted-foreground">
              No debts tracked yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              You&apos;re debt-free! 🎉
            </p>
          </div>
        </ItemContent>
      </Item>
    );
  }

  const daysUntilPayment = nextPayment
    ? getDaysUntil(nextPayment.nextPaymentDate)
    : null;
  const isUrgent = daysUntilPayment !== null && daysUntilPayment <= 7;

  const itemClass = isUrgent
    ? "border-0 bg-orange-50/50 dark:bg-orange-950/20"
    : "border-0";

  return (
    <Item variant="outline" className={`h-full ${itemClass}`}>
      <ItemContent className="space-y-4 w-full">
        {/* Next Payment Due */}
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Next Payment</div>
          <div className="space-y-1">
            <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
              {formatAmount(nextPayment?.nextPaymentAmount ?? 0)}
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground">Due:</span>{" "}
              <span className="font-medium">
                {formatDate(nextPayment?.nextPaymentDate ?? 0)}
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

        {/* Total Owed */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Total Owed</div>
          <div className="text-lg font-semibold">
            {formatAmount(totalOwed ?? 0)}
          </div>
          <div className="text-xs text-muted-foreground">
            Across {debts.length} debt{debts.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Action Button */}
        <Link href="/dashboard?tab=debts" className="block">
          <Button variant="outline" size="sm" className="w-full border-0">
            View All Debts
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      </ItemContent>
    </Item>
  );
}
