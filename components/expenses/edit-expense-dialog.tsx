"use client";

import { useState, useEffect } from "react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import type { Expense, Category } from "@/types";

interface EditExpenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expense: Expense | null;
}

export function EditExpenseDialog({
  open,
  onOpenChange,
  expense,
}: EditExpenseDialogProps) {
  const user = db.useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch profile and categories
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      categories: {
        $: {
          order: { name: "asc" },
        },
      },
    },
  });

  const profile = data?.profiles?.[0];
  const categories: Category[] = (profile?.categories || []).filter(
    (category) =>
      category.isActive !== false || category.name === selectedCategory
  );

  // Initialize form fields when expense changes
  useEffect(() => {
    if (expense) {
      setSelectedCategory(expense.category || "Uncategorized");
      setAmount(expense.amount.toString());
      setRecipient(expense.recipient || "");
      setNotes(expense.notes || "");
    }
  }, [expense]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expense) return;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsSubmitting(true);
    try {
      await db.transact(
        db.tx.expenses[expense.id].update({
          category: selectedCategory || "Uncategorized",
          amount: parsedAmount,
          recipient: recipient.trim() || "Unknown",
          notes: notes.trim() || undefined,
        })
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryCreated = (categoryId: string, categoryName: string) => {
    // Refresh categories query will happen automatically
    // Set the newly created category as selected
    setSelectedCategory(categoryName);
    setShowAddCategoryDialog(false);
  };

  if (!expense) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details for this expense.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient</Label>
              <Input
                id="recipient"
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Enter recipient name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-select">Category</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger id="category-select" className="flex-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {!categories.some(
                      (cat) => cat.name === "Uncategorized"
                    ) && (
                      <SelectItem value="Uncategorized">
                        Uncategorized
                      </SelectItem>
                    )}
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddCategoryDialog(true)}
                >
                  + New
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                rows={3}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  );
}
