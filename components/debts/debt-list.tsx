"use client";

import { useState, useMemo, useCallback } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DebtPaymentForm } from "./debt-payment-form";
import { DebtProgress } from "./debt-progress";
import { DebtAnalytics } from "./debt-analytics";
import { createDebtListConfig } from "./debt-list-config";
import type { DebtWithUser } from "@/types";
import { toast } from "sonner";

export function DebtList() {
  const user = db.useUser();
  const [selectedDebtForPayment, setSelectedDebtForPayment] =
    useState<DebtWithUser | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtWithUser | null>(null);

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

  const handleRecordPayment = useCallback((debt: DebtWithUser) => {
    setSelectedDebtForPayment(debt);
    setShowPaymentSheet(true);
  }, []);

  const handleEdit = useCallback((debt: DebtWithUser) => {
    setEditingDebt(debt);
  }, []);

  const handleQuickPush = useCallback(async (debt: DebtWithUser) => {
    if (!debt.interestRate || debt.currentBalance === 0) {
      toast.error("Cannot push debt", {
        description:
          "This debt doesn't have an interest rate or is already paid off.",
      });
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

      toast.success("Payment recorded", {
        description: `Interest payment of Ksh ${monthlyInterest.toLocaleString()} recorded. Debt pushed to next month.`,
      });
    } catch (error) {
      console.error("Error recording quick push:", error);
      toast.error("Failed to record payment", {
        description: "Please try again.",
      });
    }
  }, []);

  // Create configuration with callbacks
  const config = useMemo(
    () =>
      createDebtListConfig(handleRecordPayment, handleQuickPush, handleEdit),
    [handleRecordPayment, handleQuickPush, handleEdit]
  );

  return (
    <>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="list">All Debts</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <UnifiedListContainer<DebtWithUser>
            config={config}
            data={debts}
            editingItem={editingDebt}
            onEditingChange={setEditingDebt}
          />
        </TabsContent>
        <TabsContent value="progress">
          <DebtProgress />
        </TabsContent>
        <TabsContent value="analytics">
          <DebtAnalytics />
        </TabsContent>
      </Tabs>

      <Sheet open={showPaymentSheet} onOpenChange={setShowPaymentSheet}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto pb-safe"
        >
          <SheetHeader>
            <SheetTitle>Record Payment</SheetTitle>
          </SheetHeader>
          {selectedDebtForPayment && (
            <div className="mt-6">
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
