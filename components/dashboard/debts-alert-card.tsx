"use client";

import { Item, ItemContent } from "@/components/ui/item";
import { AlertCircle, ArrowRight, Wallet } from "lucide-react";

import { useCurrency } from "@/hooks/use-currency";
import { getExpenseColor } from "@/lib/dashboard-colors";
import { Debt } from "@/types";

interface DebtsAlertCardProps {
  debts: Debt[];
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

  const totalOwed = debts.reduce(
    (sum, debt) => sum + (debt.currentBalance || 0),
    0
  );

  // Find next payment due
  const nextPayment = debts
    .filter((d) => d.nextPaymentDueDate && d.nextPaymentDueDate > now.getTime())
    .sort(
      (a, b) => (a.nextPaymentDueDate || 0) - (b.nextPaymentDueDate || 0)
    )[0];

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

  const daysUntilPayment =
    nextPayment && nextPayment.nextPaymentDueDate
      ? getDaysUntil(nextPayment.nextPaymentDueDate)
      : null;

  const expenseColorClass = getExpenseColor();

  return (
    <Item variant="outline" className="h-full border-0">
      <ItemContent className="space-y-5 w-full">
        {/* Total Owed, Next Payment, Due Date - Grid of 3 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span>Total Owed</span>
            </div>
            <div
              className={`text-base font-bold tabular-nums ${expenseColorClass}`}
            >
              {formatAmount(totalOwed)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Next Payment</span>
            </div>
            <div className="text-base font-bold tabular-nums">
              {formatAmount(nextPayment?.nextPaymentAmount ?? 0)}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ArrowRight className="h-3.5 w-3.5" />
              <span>Due Date</span>
            </div>
            <div className="text-sm font-semibold leading-tight">
              {nextPayment && nextPayment.nextPaymentDueDate
                ? formatDate(nextPayment.nextPaymentDueDate)
                : "—"}
            </div>
          </div>
        </div>

        {/* Additional Context */}
        <div className="text-sm text-muted-foreground">
          {daysUntilPayment !== null ? (
            <>
              {daysUntilPayment === 0
                ? "⚠️ Payment due today!"
                : daysUntilPayment === 1
                ? "⚠️ Payment due tomorrow"
                : daysUntilPayment <= 7
                ? `⚠️ Payment due in ${daysUntilPayment} days`
                : `Next payment in ${daysUntilPayment} days`}
            </>
          ) : (
            `Tracking ${debts.length} debt${debts.length !== 1 ? "s" : ""}`
          )}
        </div>
      </ItemContent>
    </Item>
  );
}
