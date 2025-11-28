"use client";

import { useState, useMemo } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/ui/unified-list-container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DebtFormDialog } from "./debt-form-dialog";
import { DebtPaymentForm } from "./debt-payment-form";
import { createDebtListConfig } from "./debt-list-config";
import type { DebtWithUser } from "@/types";

export function DebtList() {
  const user = db.useUser();
  const [selectedDebtForPayment, setSelectedDebtForPayment] =
    useState<DebtWithUser | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  const { data } = db.useQuery({
    debts: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
      user: {},
    },
  });

  const debts: DebtWithUser[] = useMemo(() => data?.debts || [], [data?.debts]);

  const handleRecordPayment = (debt: DebtWithUser) => {
    setSelectedDebtForPayment(debt);
    setShowPaymentSheet(true);
  };

  const handleQuickPush = async (debt: DebtWithUser) => {
    if (!debt.interestRate || debt.currentBalance === 0) {
      alert("This debt doesn't have an interest rate or is already paid off.");
      return;
    }

    try {
      const now = Date.now();
      const monthlyInterest =
        (debt.currentBalance * debt.interestRate) / 100 / 12;

      const paymentId = id();
      const expenseId = id();

      await db.transact([
        db.tx.debt_payments[paymentId]
          .update({
            amount: monthlyInterest,
            paymentDate: now,
            paymentType: "interest_only",
            interestAmount: monthlyInterest,
            principalAmount: 0,
            createdAt: now,
          })
          .link({ debt: debt.id }),
        db.tx.expenses[expenseId]
          .update({
            amount: monthlyInterest,
            recipient: `Debt Payment - ${debt.name}`,
            date: now,
            category: "Debt Payment",
            rawMessage: `Interest payment of Ksh ${monthlyInterest.toLocaleString()} for ${
              debt.name
            } (Quick Push)`,
            parsedData: {
              type: "debt_payment",
              debtId: debt.id,
              debtName: debt.name,
              paymentType: "interest_only",
              interestAmount: monthlyInterest,
              principalAmount: 0,
            },
            createdAt: now,
          })
          .link({ user: debt.user?.id || "" }),
      ]);

      await db.transact(
        db.tx.debts[debt.id].update({
          pushMonthsCompleted: (debt.pushMonthsCompleted || 0) + 1,
          lastInterestPaymentDate: now,
          interestAccrued: (debt.interestAccrued || 0) + monthlyInterest,
        })
      );

      alert("Payment recorded! Debt pushed to next month.");
    } catch (error) {
      console.error("Error recording quick push:", error);
      alert("Failed to record payment. Please try again.");
    }
  };

  // Create configuration with callbacks
  const config = useMemo(
    () => createDebtListConfig(handleRecordPayment, handleQuickPush),
    [handleRecordPayment, handleQuickPush]
  );

  return (
    <>
      <UnifiedListContainer<DebtWithUser>
        config={config}
        data={debts}
        editDialog={DebtFormDialog}
      />

      <Sheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet}>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Record Payment</SheetTitle>
          </SheetHeader>
          {selectedDebtForPayment && (
            <div className="mt-4">
              <DebtPaymentForm
                debt={selectedDebtForPayment}
                onSuccess={() => {
                  setShowPaymentSheet(false);
                  setSelectedDebtForPayment(null);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
