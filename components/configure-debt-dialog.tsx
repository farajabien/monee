"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { toast } from "sonner";
import db from "@/lib/db";

interface ConfigureDebtDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  debtId?: string;
  debtAmount?: number;
  personName?: string;
}

export function ConfigureDebtDialog({
  open,
  onOpenChange,
  debtId,
  debtAmount,
  personName,
}: ConfigureDebtDialogProps) {
  const [debtType, setDebtType] = useState<string>("one-time");
  const [interestRate, setInterestRate] = useState("");
  const [compoundingFrequency, setCompoundingFrequency] = useState("monthly");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = async () => {
    if (!debtId) {
      toast.error("Debt ID not found");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        debtType,
      };

      // Only add interest-related fields if debt type requires it
      if (debtType !== "one-time") {
        const rate = parseFloat(interestRate);
        if (rate && rate > 0) {
          updateData.interestRate = rate;
          updateData.compoundingFrequency = compoundingFrequency;
        }
      }

      // Add monthly payment if specified
      const payment = parseFloat(monthlyPayment);
      if (payment && payment > 0) {
        updateData.monthlyPayment = payment;
      }

      await db.transact(db.tx.debts[debtId].update(updateData));

      toast.success("Debt configuration saved!");
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving debt configuration:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Debt</DialogTitle>
          <DialogDescription>
            Set payment terms and interest details for this debt
            {personName && ` with ${personName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Debt Type */}
          <div className="space-y-2">
            <Label htmlFor="debt-type">Debt Type</Label>
            <Select value={debtType} onValueChange={setDebtType}>
              <SelectTrigger id="debt-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="one-time">
                  One-time (No Interest)
                </SelectItem>
                <SelectItem value="interest-push">
                  Interest-Push (Pay principal first, interest accumulates)
                </SelectItem>
                <SelectItem value="amortizing">
                  Amortizing (Standard loan with monthly payments)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {debtType === "one-time" && "Simple debt without interest calculations"}
              {debtType === "interest-push" && "Interest accumulates until principal is paid"}
              {debtType === "amortizing" && "Each payment reduces both principal and interest"}
            </p>
          </div>

          {/* Interest Rate - Only show for interest-bearing debt types */}
          {debtType !== "one-time" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="interest-rate">Annual Interest Rate (%)</Label>
                <Input
                  id="interest-rate"
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  placeholder="e.g., 5.5"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Enter annual interest rate (e.g., 5 for 5%)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="compounding">Compounding Frequency</Label>
                <Select
                  value={compoundingFrequency}
                  onValueChange={setCompoundingFrequency}
                >
                  <SelectTrigger id="compounding">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {/* Monthly Payment */}
          <div className="space-y-2">
            <Label htmlFor="monthly-payment">
              Monthly Payment Amount (Optional)
            </Label>
            <Input
              id="monthly-payment"
              type="number"
              inputMode="decimal"
              step="0.01"
              placeholder={debtAmount ? `e.g., ${(debtAmount / 12).toFixed(0)}` : "0"}
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Set a fixed monthly payment amount for tracking
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleSkip}
            disabled={isSubmitting}
          >
            Skip for Now
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Configuration"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
