"use client";

import { useState, useMemo, useCallback } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { BudgetForm } from "./budget-form";
import { SteppedFormModal } from "@/components/stepped-form-modal";
import { createBudgetListConfig } from "./budget-list-config";
import type { BudgetWithRelations } from "@/types";
import { useCurrency } from "@/hooks/use-currency";

export function BudgetList() {
  const user = db.useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBudget, setEditingBudget] =
    useState<BudgetWithRelations | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      budgets: {
        $: {
          where: {
            month: currentMonth,
            year: currentYear,
          },
        },
        category: {},
      },
    },
  });

  const profile = data?.profiles?.[0];
  const budgets: BudgetWithRelations[] = useMemo(() => {
    // Add user reference for compatibility with full profile data
    return (profile?.budgets || []).map((budget) => ({
      ...budget,
      user: profile
        ? {
            id: profile.id,
            handle: profile.handle,
            monthlyBudget: profile.monthlyBudget,
            createdAt: profile.createdAt,
            onboardingCompleted: profile.onboardingCompleted,
            onboardingStep: profile.onboardingStep,
            currency: profile.currency,
            locale: profile.locale,
          }
        : undefined,
    }));
  }, [profile?.budgets, profile]);

  const currency = profile?.currency;
  const locale = profile?.locale;
  const { formatCurrency } = useCurrency(currency, locale);

  // Extract edit handler to useCallback
  const handleEdit = useCallback(async (item: BudgetWithRelations) => {
    setEditingBudget(item);
    setShowAddDialog(true);
  }, []);

  // Create configuration with edit handler
  const config = useMemo(() => {
    const baseConfig = createBudgetListConfig(
      currentMonth,
      currentYear,
      formatCurrency
    );
    return {
      ...baseConfig,
      actions: {
        ...baseConfig.actions,
        edit: handleEdit,
      },
    };
  }, [currentMonth, currentYear, formatCurrency, handleEdit]);

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
