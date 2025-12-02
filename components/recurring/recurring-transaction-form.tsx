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
import type { RecurringTransaction } from "@/lib/recurring-transaction-matcher";

interface RecurringTransactionFormProps {
  recurringTransaction?: RecurringTransaction | null;
  onSuccess?: () => void;
  onCancel?: () => void;
  categories?: Array<{ name: string }>;
}

export function RecurringTransactionForm({
  recurringTransaction,
  onSuccess,
  onCancel,
  categories = [],
}: RecurringTransactionFormProps) {
  const user = db.useUser();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [recipient, setRecipient] = useState("");
  const [category, setCategory] = useState("Uncategorized");
  const [frequency, setFrequency] = useState("monthly");
  const [paybillNumber, setPaybillNumber] = useState("");
  const [tillNumber, setTillNumber] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form if editing
  useEffect(() => {
    if (recurringTransaction) {
      setName(recurringTransaction.name);
      setAmount(recurringTransaction.amount.toString());
      setRecipient(recurringTransaction.recipient);
      setCategory(recurringTransaction.category);
      setFrequency(recurringTransaction.frequency);
      setPaybillNumber(recurringTransaction.paybillNumber || "");
      setTillNumber(recurringTransaction.tillNumber || "");
      setAccountNumber(recurringTransaction.accountNumber || "");
      setIsActive(recurringTransaction.isActive);
    }
  }, [recurringTransaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !recipient.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate that at least one payment identifier is provided
    if (!paybillNumber.trim() && !tillNumber.trim() && !recipient.trim()) {
      alert(
        "Please provide at least one payment identifier (Paybill, Till, or Recipient name)"
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const transactionData = {
        name: name.trim(),
        amount: parseFloat(amount),
        recipient: recipient.trim(),
        category: category || "Uncategorized",
        frequency,
        paybillNumber: paybillNumber.trim() || undefined,
        tillNumber: tillNumber.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        isActive,
        createdAt: Date.now(),
      };

      if (recurringTransaction) {
        // Update existing recurring transaction
        await db.transact(
          db.tx.recurring_transactions[recurringTransaction.id].update(
            transactionData
          )
        );
      } else {
        // Create new recurring transaction
        await db.transact(
          db.tx.recurring_transactions[id()]
            .update(transactionData)
            .link({ profile: user.id })
        );
      }

      // Reset form
      setName("");
      setAmount("");
      setRecipient("");
      setCategory("Uncategorized");
      setFrequency("monthly");
      setPaybillNumber("");
      setTillNumber("");
      setAccountNumber("");
      setIsActive(true);

      onSuccess?.();
    } catch (error) {
      console.error("Error saving recurring transaction:", error);
      alert("Failed to save recurring transaction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">
          Transaction Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          type="text"
          placeholder="e.g., Rent, Netflix Subscription, Electricity"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">
          A descriptive name for this recurring transaction
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">
            Amount <span className="text-red-500">*</span>
          </Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger id="frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="quarterly">Quarterly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="recipient">
          Recipient <span className="text-red-500">*</span>
        </Label>
        <Input
          id="recipient"
          type="text"
          placeholder="e.g., Landlord, Safaricom"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Uncategorized">Uncategorized</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-sm font-medium">
          M-PESA Payment Details (Optional but Recommended)
        </h3>
        <p className="text-xs text-muted-foreground">
          These details help automatically match future transactions to this
          recurring payment
        </p>

        <div className="space-y-2">
          <Label htmlFor="paybill">Paybill Number</Label>
          <Input
            id="paybill"
            type="text"
            placeholder="e.g., 400200"
            value={paybillNumber}
            onChange={(e) => setPaybillNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="till">Till Number</Label>
          <Input
            id="till"
            type="text"
            placeholder="e.g., 123456"
            value={tillNumber}
            onChange={(e) => setTillNumber(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="account">Account Number</Label>
          <Input
            id="account"
            type="text"
            placeholder="e.g., Your account/reference number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Used with paybill number for precise matching
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(checked as boolean)}
        />
        <Label htmlFor="active" className="text-sm font-normal cursor-pointer">
          Active (Enable automatic matching for this transaction)
        </Label>
      </div>

      <div className="flex gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? "Saving..."
            : recurringTransaction
            ? "Update Transaction"
            : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
