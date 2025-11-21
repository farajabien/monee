"use client";

import { useState } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { BudgetForm } from "./budget-form";
import { SteppedFormModal } from "@/components/stepped-form-modal";
import type { BudgetWithRelations, Category } from "@/types";

export function BudgetList() {
  const user = db.useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBudget, setEditingBudget] =
    useState<BudgetWithRelations | null>(null);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const { isLoading, error, data } = db.useQuery({
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

  const handleDelete = (budgetId: string) => {
    if (confirm("Are you sure you want to delete this budget?")) {
      db.transact(db.tx.budgets[budgetId].delete());
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Loading budgets...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
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
        <CardContent className="space-y-4">
          {budgets.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="mb-2">No budgets set for this month.</p>
              <p className="text-sm">
                Create a budget to track your spending goals.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {budgets.map((budget) => (
                <Card key={budget.id}>
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {budget.category?.name || "Unknown Category"}
                          </span>
                          <Badge variant="secondary">
                            {formatAmount(budget.amount)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {new Date(2000, budget.month - 1).toLocaleString(
                            "default",
                            {
                              month: "long",
                            }
                          )}{" "}
                          {budget.year}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingBudget(budget);
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(budget.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
