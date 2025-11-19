"use client";

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Category, Budget } from "@/types";

interface BudgetFormProps {
  budget?: Budget | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function BudgetForm({ budget, onSuccess, onCancel }: BudgetFormProps) {
  const user = db.useUser();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories
  const { data: categoriesData } = db.useQuery({
    categories: {
      $: {
        where: { "user.id": user.id },
        order: { name: "asc" },
      },
    },
  });

  const categories: Category[] = categoriesData?.categories || [];

  // Initialize form if editing
  useEffect(() => {
    if (budget) {
      setSelectedCategoryId(budget.category?.id || "");
      setAmount(budget.amount.toString());
      setMonth(budget.month);
      setYear(budget.year);
    }
  }, [budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !amount) return;

    setIsSubmitting(true);
    try {
      const budgetData = {
        amount: parseFloat(amount),
        month,
        year,
      };

      if (budget) {
        // Update existing budget
        await db.transact(
          db.tx.budgets[budget.id].update(budgetData)
        );
      } else {
        // Create new budget
        await db.transact(
          db.tx.budgets[id()]
            .update(budgetData)
            .link({ category: selectedCategoryId, user: user.id })
        );
      }

      // Reset form
      setSelectedCategoryId("");
      setAmount("");
      setMonth(new Date().getMonth() + 1);
      setYear(new Date().getFullYear());

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving budget:", error);
      alert("Failed to save budget. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="budget-category">Category</Label>
        <Select
          value={selectedCategoryId}
          onValueChange={setSelectedCategoryId}
          disabled={!!budget} // Can't change category when editing
        >
          <SelectTrigger id="budget-category">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="budget-month">Month</Label>
          <Select
            value={month.toString()}
            onValueChange={(value) => setMonth(parseInt(value, 10))}
          >
            <SelectTrigger id="budget-month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(2000, m - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget-year">Year</Label>
          <Input
            id="budget-year"
            type="number"
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
            min={2020}
            max={2100}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-amount">Amount (Ksh)</Label>
        <Input
          id="budget-amount"
          type="number"
          placeholder="5000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0"
          step="0.01"
        />
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting || !selectedCategoryId || !amount}>
          {isSubmitting ? "Saving..." : budget ? "Update Budget" : "Create Budget"}
        </Button>
      </div>
    </form>
  );
}

