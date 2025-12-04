"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { RecurringTransaction } from "@/types";

interface RecurringPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: RecurringTransaction;
  profileId: string;
}

export function RecurringPaymentDialog({
  open,
  onOpenChange,
  transaction,
  profileId,
}: RecurringPaymentDialogProps) {
  const [paymentType, setPaymentType] = useState<"single" | "multiple">("single");
  const [monthsAhead, setMonthsAhead] = useState(1);
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [customAmount, setCustomAmount] = useState(transaction.amount);
  const [isPaying, setIsPaying] = useState(false);

  // Calculate next due date based on frequency
  const calculateNextDueDate = (currentDue: number, frequency: string, count: number = 1): number => {
    const date = new Date(currentDue);
    switch (frequency) {
      case "weekly":
        date.setDate(date.getDate() + (7 * count));
        break;
      case "biweekly":
        date.setDate(date.getDate() + (14 * count));
        break;
      case "monthly":
        date.setMonth(date.getMonth() + count);
        break;
      case "quarterly":
        date.setMonth(date.getMonth() + (3 * count));
        break;
      case "yearly":
      case "annually":
        date.setFullYear(date.getFullYear() + count);
        break;
      default:
        date.setMonth(date.getMonth() + count);
    }
    return date.getTime();
  };

  const handlePayment = async () => {
    setIsPaying(true);
    try {
      const now = Date.now();
      const paymentTimestamp = paymentDate.getTime();
      const transactions = [];

      if (paymentType === "single") {
        // Single payment
        const expenseId = id();
        const nextDue = calculateNextDueDate(
          transaction.nextDueDate || now,
          transaction.frequency
        );

        transactions.push(
          // Create expense record
          db.tx.expenses[expenseId]
            .update({
              amount: customAmount,
              recipient: transaction.recipient,
              date: paymentTimestamp,
              category: transaction.category,
              rawMessage: `Recurring: ${transaction.name}`,
              notes: `Paid for ${format(paymentDate, "MMMM yyyy")}`,
              parsedData: { type: "recurring", recurringId: transaction.id },
              isRecurring: true,
              linkedRecurringId: transaction.id,
              createdAt: now,
            })
            .link({ profile: profileId }),

          // Update recurring transaction
          db.tx.recurring_transactions[transaction.id].update({
            lastPaidDate: paymentTimestamp,
            nextDueDate: nextDue,
          })
        );

        await db.transact(transactions);
        toast.success(`Payment recorded for ${transaction.name}`);
      } else {
        // Multiple payments (advance payment)
        const expenses = [];
        let currentDue = transaction.nextDueDate || now;

        for (let i = 0; i < monthsAhead; i++) {
          const expenseId = id();
          const paymentMonth = new Date(currentDue);
          
          expenses.push(
            db.tx.expenses[expenseId]
              .update({
                amount: customAmount,
                recipient: transaction.recipient,
                date: paymentTimestamp,
                category: transaction.category,
                rawMessage: `Recurring: ${transaction.name} (Advance Payment ${i + 1}/${monthsAhead})`,
                notes: `Paid in advance for ${format(paymentMonth, "MMMM yyyy")}`,
                parsedData: {
                  type: "recurring",
                  recurringId: transaction.id,
                  advancePayment: true,
                  paymentIndex: i + 1,
                  totalPayments: monthsAhead,
                },
                isRecurring: true,
                linkedRecurringId: transaction.id,
                createdAt: now + i, // Slight offset to maintain order
              })
              .link({ profile: profileId })
          );

          currentDue = calculateNextDueDate(currentDue, transaction.frequency);
        }

        // Update recurring transaction with final due date
        expenses.push(
          db.tx.recurring_transactions[transaction.id].update({
            lastPaidDate: paymentTimestamp,
            nextDueDate: currentDue,
          })
        );

        await db.transact(expenses);
        toast.success(
          `Recorded ${monthsAhead} advance payments for ${transaction.name}`
        );
      }

      onOpenChange(false);
      // Reset form
      setPaymentType("single");
      setMonthsAhead(1);
      setCustomAmount(transaction.amount);
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error("Failed to record payment");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record payment for {transaction.name} - {transaction.recipient}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Type */}
          <div className="space-y-2">
            <Label>Payment Type</Label>
            <Select
              value={paymentType}
              onValueChange={(v) => setPaymentType(v as "single" | "multiple")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single Payment</SelectItem>
                <SelectItem value="multiple">Pay Multiple Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Months Ahead (if multiple) */}
          {paymentType === "multiple" && (
            <div className="space-y-2">
              <Label>Number of Months to Pay</Label>
              <Select
                value={monthsAhead.toString()}
                onValueChange={(v) => setMonthsAhead(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 12].map((months) => (
                    <SelectItem key={months} value={months.toString()}>
                      {months} {months === 1 ? "Month" : "Months"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Total: {new Intl.NumberFormat("en-KE", {
                  style: "currency",
                  currency: "KES",
                }).format(customAmount * monthsAhead)}
              </p>
            </div>
          )}

          {/* Payment Date */}
          <div className="space-y-2">
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !paymentDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {paymentDate ? format(paymentDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={paymentDate}
                  onSelect={(date) => date && setPaymentDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label>Amount (per {paymentType === "multiple" ? "month" : "payment"})</Label>
            <Input
              type="number"
              value={customAmount}
              onChange={(e) => setCustomAmount(parseFloat(e.target.value))}
              step="0.01"
              min="0"
            />
            <p className="text-xs text-muted-foreground">
              Default: {new Intl.NumberFormat("en-KE", {
                style: "currency",
                currency: "KES",
              }).format(transaction.amount)}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPaying}
          >
            Cancel
          </Button>
          <Button onClick={handlePayment} disabled={isPaying}>
            <Check className="mr-2 h-4 w-4" />
            {isPaying
              ? "Recording..."
              : paymentType === "multiple"
              ? `Pay ${monthsAhead} Months`
              : "Record Payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
