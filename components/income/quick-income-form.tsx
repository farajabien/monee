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
import { toast } from "sonner";

interface QuickIncomeFormProps {
  onSuccess?: () => void;
}

export function QuickIncomeForm({ onSuccess }: QuickIncomeFormProps) {
  const user = db.useUser();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [paydayDay, setPaydayDay] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) {
      toast.error("Please fill in name and amount");
      return;
    }

    setIsSubmitting(true);
    try {
      const incomeData = {
        name: name.trim(),
        amount: parseFloat(amount),
        paydayDay,
        isActive: true,
        createdAt: Date.now(),
      };

      await db.transact(
        db.tx.income_sources[id()].update(incomeData).link({ user: user.id })
      );

      toast.success("Income source added successfully!");

      // Reset form
      setName("");
      setAmount("");
      setPaydayDay(1);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error adding income source:", error);
      toast.error("Failed to add income source");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate array of days (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4">
      <div className="space-y-2">
        <Label htmlFor="income-name">Income Source Name</Label>
        <Input
          id="income-name"
          type="text"
          placeholder="e.g., Salary, Freelance"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-amount">Amount (KES)</Label>
        <Input
          id="income-amount"
          type="number"
          step="0.01"
          placeholder="50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="payday">Payday (Day of Month)</Label>
        <Select
          value={paydayDay.toString()}
          onValueChange={(value) => setPaydayDay(parseInt(value, 10))}
        >
          <SelectTrigger id="payday">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {days.map((day) => (
              <SelectItem key={day} value={day.toString()}>
                Day {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Adding..." : "Add Income Source"}
      </Button>
    </form>
  );
}
