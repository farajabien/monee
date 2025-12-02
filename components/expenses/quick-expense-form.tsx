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
import { Switch } from "@/components/ui/switch";
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
  
  // Recurring expense fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<string>("monthly");
  const [nextDueDate, setNextDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [reminderDays, setReminderDays] = useState<string>("3");

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
      const now = Date.now();
      const expenseId = id();
      const recurringId = isRecurring ? id() : undefined;

      const expenseData = {
        amount: parseFloat(amount),
        recipient: recipient.trim(),
        category: selectedCategory,
        date: new Date(expenseDate).getTime(),
        createdAt: now,
        rawMessage: `Manual: ${recipient} - KES ${amount}`,
        parsedData: {},
        isRecurring,
        recurringTransactionId: recurringId,
      };

      // Create expense
      await db.transact(
        db.tx.expenses[expenseId].update(expenseData).link({ profile: profile?.id || "" })
      );

      // If recurring, create recurring transaction record
      if (isRecurring && recurringId) {
        await db.transact(
          db.tx.recurring_transactions[recurringId]
            .update({
              name: recipient.trim(),
              amount: parseFloat(amount),
              recipient: recipient.trim(),
              category: selectedCategory,
              frequency,
              dueDate: new Date(nextDueDate).getTime(),
              nextDueDate: new Date(nextDueDate).getTime(),
              lastPaidDate: new Date(expenseDate).getTime(),
              reminderDays: reminderDays ? parseInt(reminderDays) : undefined,
              isActive: true,
              isPaused: false,
              createdAt: now,
            })
            .link({ profile: profile?.id || "" })
        );
      }

      toast.success(isRecurring ? "Recurring expense created!" : "Expense added successfully!");

      // Reset form
      setAmount("");
      setRecipient("");
      setSelectedCategory("Uncategorized");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setFrequency("monthly");
      setReminderDays("3");

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

      {/* Recurring Expense Toggle */}
      <div className="flex items-center space-x-2 py-2 px-3 bg-muted rounded-lg">
        <Switch
          id="is-recurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />
        <Label htmlFor="is-recurring" className="cursor-pointer">
          Make this a recurring expense
        </Label>
      </div>

      {/* Recurring Options */}
      {isRecurring && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger id="frequency">
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
            <Label htmlFor="next-due">Next Due Date</Label>
            <Input
              id="next-due"
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder">Remind me (days before)</Label>
            <Input
              id="reminder"
              type="number"
              min="0"
              placeholder="3"
              value={reminderDays}
              onChange={(e) => setReminderDays(e.target.value)}
            />
          </div>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : isRecurring ? "Create Recurring Expense" : "Add Expense"}
      </Button>

      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
      />
    </form>
  );
}
