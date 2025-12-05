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
import { Switch } from "@/components/ui/switch";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import type { Expense, Category, RecurringFrequency } from "@/types";

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
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [reminderDays, setReminderDays] = useState("3");
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
      setIsRecurring(expense.isRecurring || false);
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
          isRecurring: isRecurring,
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
        <DialogContent className="max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle>Edit Expense</DialogTitle>
            <DialogDescription>
              Update the details for this expense.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <Tabs defaultValue="basic" className="flex-1 flex flex-col min-h-0">
              <TabsList className="mx-6 grid w-[calc(100%-3rem)] grid-cols-3 shrink-0 h-10">
                <TabsTrigger value="basic" className="py-2 text-xs sm:text-sm">
                  Basic
                </TabsTrigger>
                <TabsTrigger value="details" className="py-2 text-xs sm:text-sm">
                  Details
                </TabsTrigger>
                <TabsTrigger value="recurring" className="py-2 text-xs sm:text-sm">
                  Recurring
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                <TabsContent value="basic" className="space-y-4 mt-0">
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
                </TabsContent>

                <TabsContent value="details" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add any additional notes..."
                      rows={5}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="recurring" className="space-y-4 mt-0">
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <Label htmlFor="recurring-toggle" className="text-sm font-medium">
                        Recurring Expense
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Set this expense to repeat automatically
                      </p>
                    </div>
                    <Switch
                      id="recurring-toggle"
                      checked={isRecurring}
                      onCheckedChange={setIsRecurring}
                    />
                  </div>

                  {isRecurring && (
                    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
                      <div className="space-y-2">
                        <Label htmlFor="recurring-frequency">Frequency</Label>
                        <Select value={recurringFrequency} onValueChange={(value) => setRecurringFrequency(value as RecurringFrequency)}>
                          <SelectTrigger id="recurring-frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="biweekly">Bi-weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="annually">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="next-due-date">Next Due Date</Label>
                        <Input
                          id="next-due-date"
                          type="date"
                          value={nextDueDate}
                          onChange={(e) => setNextDueDate(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reminder-days">Reminder (days before)</Label>
                        <Input
                          id="reminder-days"
                          type="number"
                          placeholder="3"
                          value={reminderDays}
                          onChange={(e) => setReminderDays(e.target.value)}
                          min="0"
                          max="30"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </Tabs>

            {/* Sticky Action Buttons */}
            <DialogFooter className="px-6 py-4 border-t shrink-0">
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
