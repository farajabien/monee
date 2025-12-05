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
import { QuickDebtForm } from "./quick-debt-form";
import { DebtProgress } from "./debt-progress";
import { DebtInsights } from "./debt-insights";
import { createDebtListConfig } from "./debt-list-config";
import type { Debt, DebtWithUser } from "@/types";
import { toast } from "sonner";

export function DebtList() {
  const user = db.useUser();
  const [selectedDebtForPayment, setSelectedDebtForPayment] =
    useState<DebtWithUser | null>(null);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtWithUser | null>(null);
  const [analyticsView, setAnalyticsView] = useState<
    "overview" | "timeline" | "breakdown"
  >("overview");
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      debts: {
        $: {
          order: { createdAt: "desc" },
        },
      },
    },
  });

  const profile = data?.profiles?.[0];
  const debts = useMemo(() => {
    if (!profile) return [];
    return (profile.debts || []).map((debt) => ({
      ...debt,
      profile: {
        id: profile.id,
        handle: profile.handle,
        monthlyBudget: profile.monthlyBudget,
        createdAt: profile.createdAt,
        onboardingCompleted: profile.onboardingCompleted,
        onboardingStep: profile.onboardingStep,
        currency: profile.currency,
        locale: profile.locale,
      },
    })) as DebtWithUser[];
  }, [profile]);

  const handleRecordPayment = useCallback((debt: DebtWithUser) => {
    setSelectedDebtForPayment(debt);
    setShowPaymentSheet(true);
  }, []);

  const handleEdit = useCallback((debt: DebtWithUser) => {
    setEditingDebt(debt);
  }, []);

  const handleQuickPush = useCallback(
    async (debt: DebtWithUser) => {
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
            .link({ profile: profile?.id || "" }),
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
    },
    [profile]
  );

  // Create configuration with callbacks
  const config = useMemo(
    () =>
      createDebtListConfig(handleRecordPayment, handleQuickPush, handleEdit),
    [handleRecordPayment, handleQuickPush, handleEdit]
  );

  return (
    <>
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-4 h-10">
          <TabsTrigger value="list" className="py-2 text-xs sm:text-sm">
            All Debts
          </TabsTrigger>
          <TabsTrigger value="progress" className="py-2 text-xs sm:text-sm">
            Progress
          </TabsTrigger>
          <TabsTrigger value="analytics" className="py-2 text-xs sm:text-sm">
            Analytics
          </TabsTrigger>
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
          <DebtInsights onBack={() => setAnalyticsView("overview")} />
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

      <Sheet
        open={!!editingDebt}
        onOpenChange={(open) => !open && setEditingDebt(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto pb-safe"
        >
          <SheetHeader>
            <SheetTitle>Edit Debt</SheetTitle>
          </SheetHeader>
          {editingDebt && (
            <div className="mt-6">
              <QuickDebtForm
                debt={editingDebt}
                onSuccess={() => {
                  setEditingDebt(null);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
