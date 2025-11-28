"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { QuickExpenseForm } from "@/components/expenses/quick-expense-form";
import { QuickIncomeForm } from "@/components/income/quick-income-form";
import { QuickDebtForm } from "@/components/debts/quick-debt-form";
import { QuickBudgetForm } from "@/components/budgets/quick-budget-form";
import { SavingsGoalForm } from "@/components/savings/savings-goal-form";
import db from "@/lib/db";

export type QuickAddTab = "expense" | "income" | "debt" | "savings" | "budget";

interface QuickAddSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: QuickAddTab;
}

export function QuickAddSheet({
  open,
  onOpenChange,
  defaultTab = "expense",
}: QuickAddSheetProps) {
  const [activeTab, setActiveTab] = useState<QuickAddTab>(defaultTab);
  const user = db.useUser();
  const { data } = db.useQuery({ profiles: {} });
  const profile = data?.profiles?.[0];

  // Update active tab when defaultTab changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleSuccess = () => {
    // Close sheet on successful submission
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto pb-safe"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Quick Add</SheetTitle>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as QuickAddTab)} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4 sticky top-0 bg-background z-10">
            <TabsTrigger value="expense" className="text-xs">
              Expense
            </TabsTrigger>
            <TabsTrigger value="income" className="text-xs">
              Income
            </TabsTrigger>
            <TabsTrigger value="debt" className="text-xs">
              Debt
            </TabsTrigger>
            <TabsTrigger value="savings" className="text-xs">
              Savings
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-xs">
              Budget
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expense" className="mt-0">
            <QuickExpenseForm onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="income" className="mt-0">
            <QuickIncomeForm onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="debt" className="mt-0">
            <QuickDebtForm onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="savings" className="mt-0">
            {profile && (
              <SavingsGoalForm
                profileId={profile.id}
                onSuccess={handleSuccess}
                asDialog={false}
              />
            )}
          </TabsContent>

          <TabsContent value="budget" className="mt-0">
            <QuickBudgetForm onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
