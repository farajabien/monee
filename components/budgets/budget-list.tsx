"use client";
import { DataTable } from "@/components/ui/data-table";
import { budgetColumns } from "@/components/budgets/budget-columns";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Item } from "@/components/ui/item";
import { Plus, Edit, Trash2 } from "lucide-react";
import { DataViewControls } from "@/components/ui/data-view-controls";
import { BudgetForm } from "./budget-form";
import { SteppedFormModal } from "@/components/stepped-form-modal";
import type { BudgetWithRelations, Category } from "@/types";

export function BudgetList() {
  const user = db.useUser();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingBudget, setEditingBudget] =
    useState<BudgetWithRelations | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("amount-high");

  const handleViewModeChange = (mode: "grid" | "list" | "table") => {
    if (mode !== "table") setViewMode(mode);
  };

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

  // Filter and sort budgets
  const filteredAndSortedBudgets = useMemo(() => {
    let result = [...budgets];

    // Search filter
    if (searchQuery) {
      result = result.filter((b) =>
        b.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "amount-high":
          return b.amount - a.amount;
        case "amount-low":
          return a.amount - b.amount;
        case "category":
          return (a.category?.name || "").localeCompare(b.category?.name || "");
        default:
          return b.amount - a.amount;
      }
    });

    return result;
  }, [budgets, searchQuery, sortBy]);

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
          <DataViewControls
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
            searchPlaceholder="Search budgets..."
            sortValue={sortBy}
            onSortChange={setSortBy}
            sortOptions={[
              { value: "amount-high", label: "Amount: High to Low" },
              { value: "amount-low", label: "Amount: Low to High" },
              { value: "category", label: "Category (A-Z)" },
            ]}
            totalCount={budgets.length}
            filteredCount={filteredAndSortedBudgets.length}
          />

          {filteredAndSortedBudgets.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              {searchQuery ? (
                <p>No budgets found matching &quot;{searchQuery}&quot;</p>
              ) : (
                <>
                  <p className="mb-2">No budgets set for this month.</p>
                  <p className="text-sm">
                    Create a budget to track your spending goals.
                  </p>
                </>
              )}
            </div>
          )}

          {filteredAndSortedBudgets.length > 0 && viewMode === "list" && (
            <DataTable
              columns={budgetColumns}
              data={filteredAndSortedBudgets}
              onEdit={(budget) => {
                setEditingBudget(budget);
                setShowAddDialog(true);
              }}
              onDelete={handleDelete}
            />
          )}

          {filteredAndSortedBudgets.length > 0 && viewMode === "grid" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedBudgets.map((budget, index) => (
                <Card key={budget.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingBudget(budget);
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(budget.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-semibold">
                        {budget.category?.name || "Unknown Category"}
                      </h4>
                      <div className="text-2xl font-bold text-primary">
                        {formatAmount(budget.amount)}
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
