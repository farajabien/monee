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

interface QuickExpenseFormProps {
  onSuccess?: () => void;
}

export function QuickExpenseForm({ onSuccess }: QuickExpenseFormProps) {
  const { user } = db.useAuth();
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Uncategorized");
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch profile and categories
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id || "" },
      },
      categories: {},
    },
  });
  const profile = data?.profiles?.[0];
  const categories: Category[] = (profile?.categories || []).filter(
    (c) => c.isActive !== false
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !recipient.trim()) {
      toast.error("Please fill in amount and recipient");
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        amount: parseFloat(amount),
        recipient: recipient.trim(),
        category: selectedCategory,
        date: new Date(expenseDate).getTime(),
        createdAt: Date.now(),
        rawMessage: `Manual: ${recipient} - KES ${amount}`,
        parsedData: {},
      };

      await db.transact(
        db.tx.expenses[id()].update(expenseData).link({ profile: profile?.id || "" })
      );

      toast.success("Expense added successfully!");

      // Reset form
      setAmount("");
      setRecipient("");
      setSelectedCategory("Uncategorized");
      setExpenseDate(new Date().toISOString().split("T")[0]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      toast.error("Failed to add expense");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="amount">Amount (KES)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          placeholder="500"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipient">Recipient</Label>
        <Input
          id="recipient"
          type="text"
          placeholder="e.g., Naivas, Uber"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
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
        <Label htmlFor="date">Date</Label>
        <Input
          id="date"
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Expense"}
      </Button>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
      />
    </form>
  );
}
