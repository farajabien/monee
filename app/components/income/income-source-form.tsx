"use client";

import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import type { IncomeSource } from "@/types";

interface IncomeSourceFormProps {
  incomeSource?: IncomeSource | null;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IncomeSourceForm({
  incomeSource,
  onSuccess,
  onCancel,
}: IncomeSourceFormProps) {
  const user = db.useUser();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [paydayDay, setPaydayDay] = useState<number>(1);
  const [paydayMonth, setPaydayMonth] = useState<number | undefined>(undefined);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form if editing
  useEffect(() => {
    if (incomeSource) {
      setName(incomeSource.name);
      setAmount(incomeSource.amount.toString());
      setPaydayDay(incomeSource.paydayDay);
      setPaydayMonth(incomeSource.paydayMonth);
      setIsActive(incomeSource.isActive);
    }
  }, [incomeSource]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount) return;

    setIsSubmitting(true);
    try {
      const incomeData = {
        name: name.trim(),
        amount: parseFloat(amount),
        paydayDay,
        paydayMonth: paydayMonth || undefined,
        isActive,
        createdAt: incomeSource?.createdAt || Date.now(),
      };

      if (incomeSource) {
        // Update existing income source
        await db.transact(
          db.tx.income_sources[incomeSource.id].update(incomeData)
        );
      } else {
        // Create new income source
        await db.transact(
          db.tx.income_sources[id()].update(incomeData).link({ user: user.id })
        );
      }

      // Reset form
      setName("");
      setAmount("");
      setPaydayDay(1);
      setPaydayMonth(undefined);
      setIsActive(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving income source:", error);
      alert("Failed to save income source. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="income-name">Income Source Name</Label>
        <Input
          id="income-name"
          type="text"
          placeholder="e.g., Salary, Freelance, Side Hustle"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="income-amount">Monthly Amount (Ksh)</Label>
        <Input
          id="income-amount"
          type="number"
          placeholder="50000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          min="0"
          step="0.01"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="payday-day">Payday Day (1-31)</Label>
          <Input
            id="payday-day"
            type="number"
            min="1"
            max="31"
            value={paydayDay}
            onChange={(e) => setPaydayDay(parseInt(e.target.value, 10) || 1)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="payday-month">Payday Month (Optional)</Label>
          <Select
            value={paydayMonth?.toString() || ""}
            onValueChange={(value) =>
              setPaydayMonth(value ? parseInt(value, 10) : undefined)
            }
          >
            <SelectTrigger id="payday-month">
              <SelectValue placeholder="Recurring monthly" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Recurring monthly</SelectItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={m.toString()}>
                  {new Date(2000, m - 1).toLocaleString("default", {
                    month: "long",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="is-active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked === true)}
        />
        <Label htmlFor="is-active" className="cursor-pointer">
          Active (include in monthly income)
        </Label>
      </div>

      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isSubmitting || !name.trim() || !amount}
        >
          {isSubmitting
            ? "Saving..."
            : incomeSource
            ? "Update Income Source"
            : "Add Income Source"}
        </Button>
      </div>
    </form>
  );
}
