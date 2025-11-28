"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface QuickDebtFormProps {
  onSuccess?: () => void;
}

export function QuickDebtForm({ onSuccess }: QuickDebtFormProps) {
  const user = db.useUser();
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !totalAmount || !monthlyPaymentAmount) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const debtData = {
        name: name.trim(),
        totalAmount: parseFloat(totalAmount),
        currentBalance: parseFloat(totalAmount), // Start with full amount
        monthlyPaymentAmount: parseFloat(monthlyPaymentAmount),
        paymentDueDay: 1, // Default to 1st of month
        createdAt: Date.now(),
      };

      await db.transact(
        db.tx.debts[id()].update(debtData).link({ user: user.id })
      );

      toast.success("Debt added successfully!");

      // Reset form
      setName("");
      setTotalAmount("");
      setMonthlyPaymentAmount("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding debt:", error);
      toast.error("Failed to add debt");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="debt-name">Debt Name</Label>
        <Input
          id="debt-name"
          type="text"
          placeholder="e.g., Car Loan, M-Shwari"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total-amount">Total Amount (KES)</Label>
        <Input
          id="total-amount"
          type="number"
          step="0.01"
          placeholder="100000"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="monthly-payment">Monthly Payment (KES)</Label>
        <Input
          id="monthly-payment"
          type="number"
          step="0.01"
          placeholder="5000"
          value={monthlyPaymentAmount}
          onChange={(e) => setMonthlyPaymentAmount(e.target.value)}
        />
      </div>

      <div className="text-xs text-muted-foreground p-2 bg-muted rounded">
        You can add interest rate, deadline, and other details later by editing this debt.
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Debt"}
      </Button>
    </form>
  );
}
