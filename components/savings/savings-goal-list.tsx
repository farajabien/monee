"use client";

import { useState, useMemo, useCallback } from "react";
import { tx } from "@instantdb/react";
import { AddToSavingsDialog } from "./add-to-savings-dialog";
import { SavingsGoalForm } from "./savings-goal-form";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { createSavingsGoalListConfig } from "./savings-goal-list-config";
import { SavingsGoal, SavingsGoalWithContributions } from "@/types";

export function SavingsGoalList() {
  const user = db.useUser();
  const [selectedGoal, setSelectedGoal] =
    useState<SavingsGoalWithContributions | null>(null);
  const [editingGoal, setEditingGoal] =
    useState<SavingsGoalWithContributions | null>(null);

  const { isLoading, error, data } = db.useQuery({
    savings_goals: {
      $: {
        where: {
          "user.id": user.id,
        },
        order: {
          createdAt: "desc",
        },
      },
      contributions: {},
      user: {},
    },
  });

  const savingsGoals = data?.savings_goals || [];

  const handleAddMoney = useCallback((goal: SavingsGoalWithContributions) => {
    setSelectedGoal(goal);
  }, []);

  const handleMarkComplete = useCallback(
    (goalId: string) => {
      const goal = savingsGoals.find((g: SavingsGoal) => g.id === goalId);
      if (!goal) return;

      if (goal.currentAmount < goal.targetAmount) {
        toast.error("Goal not yet reached. Keep saving!");
        return;
      }

      db.transact(
        tx.savings_goals[goalId].update({
          isCompleted: true,
        })
      )
        .then(() => {
          toast.success("Congratulations! Goal completed! 🎉");
        })
        .catch((err: Error) => {
          toast.error("Failed to mark as complete: " + err.message);
        });
    },
    [savingsGoals]
  );

  const handleEdit = useCallback((goal: SavingsGoalWithContributions) => {
    setEditingGoal(goal);
  }, []);

  // Create configuration with callbacks
  const config = useMemo(
    () =>
      createSavingsGoalListConfig(
        handleAddMoney,
        handleMarkComplete,
        handleEdit
      ),
    [handleAddMoney, handleMarkComplete, handleEdit]
  );

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error)
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error.message}
      </div>
    );

  if (savingsGoals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 text-6xl">💰</div>
        <h3 className="text-lg font-semibold mb-2">No Savings Goals Yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first savings goal above to start tracking your progress!
        </p>
      </div>
    );
  }

  return (
    <>
      <UnifiedListContainer config={config} data={savingsGoals} />

      {selectedGoal && (
        <AddToSavingsDialog
          goal={selectedGoal}
          open={!!selectedGoal}
          onOpenChange={(open) => {
            if (!open) setSelectedGoal(null);
          }}
        >
          <span />
        </AddToSavingsDialog>
      )}

      <Sheet
        open={!!editingGoal}
        onOpenChange={(open) => !open && setEditingGoal(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto pb-safe"
        >
          <SheetHeader>
            <SheetTitle>Edit Savings Goal</SheetTitle>
          </SheetHeader>
          {editingGoal && (
            <div className="mt-6">
              <SavingsGoalForm
                goal={editingGoal}
                asDialog={false}
                onSuccess={() => {
                  setEditingGoal(null);
                }}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
