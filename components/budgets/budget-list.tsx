"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { BudgetForm } from "./budget-form";
import { SteppedFormModal } from "@/components/stepped-form-modal";
import { createBudgetListConfig } from "./budget-list-config";
import type { BudgetWithRelations } from "@/types";

export function BudgetList() {
  const user = db.useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBudget, setEditingBudget] =
    useState<BudgetWithRelations | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data } = db.useQuery({
    budgets: {
      $: {
        where: {
          "user.id": user.id,
          month: currentMonth,
          year: currentYear,
        },
      },
      category: {},
      user: {},
    },
  });

  const budgets: BudgetWithRelations[] = data?.budgets || [];

  // Create configuration with edit handler
  const config = useMemo(() => {
    const baseConfig = createBudgetListConfig(currentMonth, currentYear);
    return {
      ...baseConfig,
      actions: {
        ...baseConfig.actions,
        edit: async (item: BudgetWithRelations) => {
          setEditingBudget(item);
          setShowAddDialog(true);
        },
      },
    };
  }, [currentMonth, currentYear]);

  return (
    <div className="space-y-4">
      <UnifiedListContainer<BudgetWithRelations>
        config={config}
        data={budgets}
      />

      <SteppedFormModal
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setEditingBudget(null);
          }
        }}
        title={editingBudget ? "Edit Budget" : "Add Budget"}
        description={`Set a spending limit for ${now.toLocaleString("default", {
          month: "long",
          year: "numeric",
        })}`}
        steps={[
          {
            id: "budget",
            title: "Budget Details",
            description: "Set your budget",
          },
        ]}
        currentStep={0}
        onStepChange={() => {}}
        renderStep={() => (
          <BudgetForm
            budget={editingBudget || undefined}
            onSuccess={() => {
              setShowAddDialog(false);
              setEditingBudget(null);
            }}
            onCancel={() => {
              setShowAddDialog(false);
              setEditingBudget(null);
            }}
          />
        )}
        showStepIndicators={false}
        showProgress={false}
        mode="dialog"
        size="md"
      />
    </div>
  );
}
