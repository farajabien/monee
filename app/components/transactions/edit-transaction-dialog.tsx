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
import { AddCategoryDialog } from "@/app/components/categories/add-category-dialog";
import type { Transaction, Category } from "@/types";

interface EditTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction | null;
}

export function EditTransactionDialog({
  open,
  onOpenChange,
  transaction,
}: EditTransactionDialogProps) {
  const user = db.useUser();
  const [selectedCategory, setSelectedCategory] = useState<string>("");
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

  const categories: Category[] = categoriesData?.categories || [];

  // Initialize selected category when transaction changes
  useEffect(() => {
    if (transaction) {
      setSelectedCategory(transaction.category || "Uncategorized");
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setIsSubmitting(true);
    try {
      await db.transact(
        db.tx.transactions[transaction.id].update({
          category: selectedCategory || "Uncategorized",
        })
      );
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating transaction:", error);
      alert("Failed to update transaction. Please try again.");
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

  if (!transaction) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction Category</DialogTitle>
            <DialogDescription>
              Update the category for this transaction.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                    <SelectItem value="Uncategorized">Uncategorized</SelectItem>
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

