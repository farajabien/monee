"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus } from "lucide-react";
import type { Category } from "@/types";

interface ManualTransactionDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ManualTransactionDialog({
  trigger,
  open,
  onOpenChange,
}: ManualTransactionDialogProps) {
  const user = db.useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Uncategorized");
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [mpesaReference, setMpesaReference] = useState<string>("");
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange !== undefined ? onOpenChange : setIsOpen;

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
    if (!amount || !recipient.trim()) {
      alert("Please fill in amount and recipient");
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        amount: parseFloat(amount),
        recipient: recipient.trim(),
        date: new Date(transactionDate).getTime(),
        category: selectedCategory || "Uncategorized",
        rawMessage: `Manual entry: Ksh${amount} to ${recipient}`,
        parsedData: {
          amount: parseFloat(amount),
          recipient: recipient.trim(),
          timestamp: new Date(transactionDate).getTime(),
          type: "manual",
        },
        notes: notes.trim() || undefined,
        mpesaReference: mpesaReference.trim() || undefined,
        createdAt: Date.now(),
      };

      await db.transact(
        db.tx.expenses[id()].update(transactionData).link({ user: user.id })
      );

      // Reset form
      setAmount("");
      setRecipient("");
      setSelectedCategory("Uncategorized");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setDialogOpen(false);
      setMpesaReference("");
    } catch (error) {
      console.error("Error adding manual transaction:", error);
      alert("Failed to add transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryCreated = (categoryId: string, categoryName: string) => {
    setSelectedCategory(categoryName);
    setShowAddCategoryDialog(false);
  };

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        {!trigger && !open && (
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Manual Entry
            </Button>
          </DialogTrigger>
        )}
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Manual Expense</DialogTitle>
            <DialogDescription>
              Manually enter a transaction that wasn&apos;t captured from M-Pesa
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Ksh)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient">Recipient / Description</Label>
              <Input
                id="recipient"
                type="text"
                placeholder="e.g., Cash payment, Market vendor"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction-date">Date</Label>
              <Input
                id="transaction-date"
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
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
                    <SelectValue placeholder="Select category" />
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

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                type="text"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mpesa-reference">
                Mpesa Reference (Optional)
              </Label>
              <Input
                id="mpesa-reference"
                type="text"
                placeholder="e.g. TKLPNAO4DP"
                value={mpesaReference}
                onChange={(e) => setMpesaReference(e.target.value)}
                maxLength={20}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Expense"}
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
