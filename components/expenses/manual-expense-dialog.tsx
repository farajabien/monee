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

interface ManualExpenseDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ManualExpenseDialog({
  trigger,
  open,
  onOpenChange,
}: ManualExpenseDialogProps) {
  const user = db.useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState<string>("");
  const [isNewRecipient, setIsNewRecipient] = useState(false);
  const [newRecipientName, setNewRecipientName] = useState<string>("");
  const [selectedCategory, setSelectedCategory] =
    useState<string>("Uncategorized");
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState<string>("");
  const [mpesaReference, setMpesaReference] = useState<string>("");
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const dialogOpen = open !== undefined ? open : isOpen;
  const setDialogOpen = onOpenChange !== undefined ? onOpenChange : setIsOpen;

  // Fetch categories and recipients
  const { data } = db.useQuery({
    categories: {
      $: {
        where: { "profile.user.id": user.id },
        order: { name: "asc" },
      },
    },
    recipients: {
      $: {
        where: { "profile.user.id": user.id },
      },
    },
    expenses: {
      $: {
        where: { "profile.user.id": user.id },
      },
    },
  });

  const categories: Category[] = (data?.categories || []).filter(
    (category) => category.isActive !== false
  );

  const savedRecipients = data?.recipients || [];
  const expenses = data?.expenses || [];

  // Get unique recipients from expenses
  const uniqueRecipients = Array.from(
    new Set(expenses.map((e) => e.recipient).filter((r) => r && r.trim()))
  );

  // Helper to get display name (nickname or original)
  const getDisplayName = (originalName: string) => {
    const recipient = savedRecipients.find(
      (r) => r.originalName === originalName
    );
    return recipient?.nickname || originalName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get the final recipient value
    const finalRecipient = isNewRecipient ? newRecipientName.trim() : recipient;

    if (!amount || !finalRecipient) {
      alert("Please fill in amount and recipient");
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        amount: parseFloat(amount),
        recipient: finalRecipient,
        date: new Date(expenseDate).getTime(),
        category: selectedCategory || "Uncategorized",
        rawMessage: `Manual entry: Ksh${amount} to ${finalRecipient}`,
        parsedData: {
          amount: parseFloat(amount),
          recipient: finalRecipient,
          timestamp: new Date(expenseDate).getTime(),
          type: "manual",
        },
        notes: notes.trim() || undefined,
        mpesaReference: mpesaReference.trim() || undefined,
        createdAt: Date.now(),
      };

      await db.transact(
        db.tx.expenses[id()].update(expenseData).link({ profile: user.id })
      );

      // Reset form
      setAmount("");
      setRecipient("");
      setIsNewRecipient(false);
      setNewRecipientName("");
      setSelectedCategory("Uncategorized");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setNotes("");
      setDialogOpen(false);
      setMpesaReference("");
    } catch (error) {
      console.error("Error adding manual expense:", error);
      alert("Failed to add expense. Please try again.");
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
              Manually enter a expense that wasn&apos;t captured from M-Pesa
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
              {!isNewRecipient ? (
                <div className="flex gap-2">
                  <Select
                    value={recipient}
                    onValueChange={(value) => {
                      if (value === "__new__") {
                        setIsNewRecipient(true);
                        setRecipient("");
                      } else {
                        setRecipient(value);
                      }
                    }}
                  >
                    <SelectTrigger id="recipient" className="flex-1">
                      <SelectValue placeholder="Select or add new recipient..." />
                    </SelectTrigger>
                    <SelectContent>
                      {uniqueRecipients.length > 0 ? (
                        <>
                          {uniqueRecipients.map((r) => (
                            <SelectItem key={r} value={r}>
                              {getDisplayName(r)}
                            </SelectItem>
                          ))}
                          <SelectItem value="__new__" className="font-medium">
                            <div className="flex items-center gap-1.5">
                              <Plus className="h-3 w-3" />
                              Add New Recipient
                            </div>
                          </SelectItem>
                        </>
                      ) : (
                        <SelectItem value="__new__" className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <Plus className="h-3 w-3" />
                            Add New Recipient
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Input
                    id="new-recipient"
                    type="text"
                    placeholder="Enter recipient name..."
                    value={newRecipientName}
                    onChange={(e) => setNewRecipientName(e.target.value)}
                    required
                    autoFocus
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsNewRecipient(false);
                      setNewRecipientName("");
                    }}
                    className="text-xs"
                  >
                    ← Back to existing recipients
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="expense-date">Date</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
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
              <Label
                htmlFor="mpesa-reference"
                className="flex items-center gap-2"
              >
                M-PESA Reference Code
                <span className="text-xs font-normal text-muted-foreground">
                  (Recommended)
                </span>
              </Label>
              <Input
                id="mpesa-reference"
                type="text"
                placeholder="e.g., TKJPNAJ1D1"
                value={mpesaReference}
                onChange={(e) =>
                  setMpesaReference(e.target.value.toUpperCase())
                }
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground">
                Enter the M-PESA transaction code to prevent duplicate entries
                when importing statements
              </p>
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
