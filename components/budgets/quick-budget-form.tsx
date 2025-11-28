"use client";

import { useState } from "react";
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
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import { toast } from "sonner";
import type { Category } from "@/types";

interface QuickBudgetFormProps {
  onSuccess?: () => void;
}

export function QuickBudgetForm({ onSuccess }: QuickBudgetFormProps) {
  const user = db.useUser();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
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

  const categories: Category[] = (categoriesData?.categories || []).filter(
    (category) => category.isActive !== false
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategoryId || !amount) {
      toast.error("Please select a category and enter an amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const budgetData = {
        amount: parseFloat(amount),
        month: currentMonth,
        year: currentYear,
      };

      await db.transact(
        db.tx.budgets[id()]
          .update(budgetData)
          .link({ category: selectedCategoryId, user: user.id })
      );

      toast.success("Budget added successfully!");

      // Reset form
      setSelectedCategoryId("");
      setAmount("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding budget:", error);
      toast.error("Failed to add budget");
    } finally {
      setIsSubmitting(false);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
        Adding budget for <span className="font-semibold">{monthName}</span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <div className="flex gap-2">
          <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
            <SelectTrigger className="flex-1" id="category">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowAddCategoryDialog(true)}
          >
            +
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget-amount">Budget Amount (KES)</Label>
        <Input
          id="budget-amount"
          type="number"
          step="0.01"
          placeholder="10000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Budget"}
      </Button>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
      />
    </form>
  );
}
