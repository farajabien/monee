"use client";

import { useState, useEffect } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { DebtWithUser } from "@/types";

interface QuickDebtFormProps {
  onSuccess?: () => void;
  debt?: DebtWithUser;
}

export function QuickDebtForm({ onSuccess, debt }: QuickDebtFormProps) {
  const { user } = db.useAuth();
  
  // Fetch profile
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id || "" },
      },
    },
  });
  const profile = data?.profiles?.[0];
  const [name, setName] = useState("");
  const [totalAmount, setTotalAmount] = useState<string>("");
  const [monthlyPaymentAmount, setMonthlyPaymentAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form fields when editing
  useEffect(() => {
    if (debt) {
      setName(debt.name || "");
      setTotalAmount(debt.totalAmount?.toString() || "");
      setMonthlyPaymentAmount(debt.monthlyPaymentAmount?.toString() || "");
    }
  }, [debt]);

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
        currentBalance: debt ? debt.currentBalance : parseFloat(totalAmount), // Keep existing balance when editing
        monthlyPaymentAmount: parseFloat(monthlyPaymentAmount),
        paymentDueDay: debt?.paymentDueDay || 1, // Keep existing or default to 1st of month
        createdAt: debt?.createdAt || Date.now(),
      };

      if (debt) {
        // Update existing debt
        await db.transact(db.tx.debts[debt.id].update(debtData));
        toast.success("Debt updated successfully!");
      } else {
        // Create new debt
        await db.transact(
          db.tx.debts[id()].update(debtData).link({ profile: profile?.id || "" })
        );
        toast.success("Debt added successfully!");
      }

      // Reset form
      setName("");
      setTotalAmount("");
      setMonthlyPaymentAmount("");

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving debt:", error);
      toast.error(debt ? "Failed to update debt" : "Failed to add debt");
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
        You can add interest rate, deadline, and other details later by editing
        this debt.
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? debt
            ? "Updating..."
            : "Adding..."
          : debt
          ? "Update Debt"
          : "Add Debt"}
      </Button>
    </form>
  );
}
