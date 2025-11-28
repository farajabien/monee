"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/ui/unified-list-container";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Budgets for{" "}
          {now.toLocaleString("default", { month: "long", year: "numeric" })}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingBudget(null);
            setShowAddDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Budget
        </Button>
      </CardHeader>

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
