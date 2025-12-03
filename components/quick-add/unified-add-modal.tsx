"use client";

import { useState } from "react";
import { id } from "@instantdb/react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Category, Recipient, RecurringFrequency, DebtType } from "@/types";
import { getDebtTypeDescription } from "@/lib/debt-calculator";

interface UnifiedAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "expense" | "income" | "debt" | "savings";
}

export function UnifiedAddModal({
  open,
  onOpenChange,
  defaultTab = "expense",
}: UnifiedAddModalProps) {
  const { user } = db.useAuth();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Common fields
  const [amount, setAmount] = useState("");
  const [isNewRecipient, setIsNewRecipient] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);

  // Entity-specific fields
  const [sourceName, setSourceName] = useState(""); // Income
  const [frequency, setFrequency] = useState("monthly"); // Income
  const [debtName, setDebtName] = useState(""); // Debt
  const [debtType, setDebtType] = useState<DebtType>("one-time"); // Debt
  const [interestRate, setInterestRate] = useState("0"); // Debt
  const [interestCalcType, setInterestCalcType] = useState<"monthly" | "yearly" | "total">("yearly"); // Debt
  const [paymentDueDay, setPaymentDueDay] = useState("1"); // Debt
  const [monthlyPayment, setMonthlyPayment] = useState(""); // Debt
  const [savingsName, setSavingsName] = useState(""); // Savings
  const [targetAmount, setTargetAmount] = useState(""); // Savings
  const [deadline, setDeadline] = useState(""); // Savings
  
  // Recurring expense fields
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState<RecurringFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [reminderDays, setReminderDays] = useState("3");

  // Fetch data
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id || "" },
      },
      categories: {},
      recipients: {},
      expenses: {},
    },
  });

  const profile = data?.profiles?.[0];
  const categories: Category[] = (profile?.categories || []).filter(
    (c) => c.isActive !== false
  );
  const savedRecipients: Recipient[] = profile?.recipients || [];
  const expenses = profile?.expenses || [];

  // Get unique recipients from expenses
  const uniqueRecipients = Array.from(
    new Set(expenses.map((e) => e.recipient).filter((r) => r && r.trim()))
  );

  // Get display name helper
  const getDisplayName = (originalName: string) => {
    const r = savedRecipients.find((sr) => sr.originalName === originalName);
    return r?.nickname || originalName;
  };

  const resetForm = () => {
    setAmount("");
    setRecipient("");
    setIsNewRecipient(false);
    setNewRecipientName("");
    setSelectedCategory("");
    setDate(new Date().toISOString().split("T")[0]);
    setSourceName("");
    setFrequency("monthly");
    setDebtName("");
    setDebtType("one-time");
    setInterestRate("0");
    setInterestCalcType("yearly");
    setPaymentDueDay("1");
    setMonthlyPayment("");
    setSavingsName("");
    setTargetAmount("");
    setDeadline("");
    setIsRecurring(false);
    setRecurringFrequency("monthly");
    setNextDueDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setReminderDays("3");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount (allow 0 for savings goals)
    if (activeTab !== "savings" && (!amount || parseFloat(amount) <= 0)) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!user?.id || !profile?.id) {
      toast.error("User not found. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const parsedAmount = parseFloat(amount) || 0;

      switch (activeTab) {
        case "expense":
          // Get the final recipient value
          const finalRecipient = isNewRecipient
            ? newRecipientName.trim()
            : recipient;

          if (!finalRecipient) {
            toast.error("Please select or enter a recipient");
            setIsSubmitting(false);
            return;
          }
          
          const expenseId = id();
          const recurringId = isRecurring ? id() : undefined;

          // Create expense
          await db.transact(
            db.tx.expenses[expenseId]
              .update({
                amount: parsedAmount,
                recipient: finalRecipient,
                date: new Date(date).getTime(),
                category: selectedCategory || "Uncategorized",
                rawMessage: `Manual entry: Ksh${amount} to ${finalRecipient}`,
                parsedData: {
                  amount: parsedAmount,
                  recipient: finalRecipient,
                  timestamp: new Date(date).getTime(),
                  type: "manual",
                },
                isRecurring: isRecurring,
                recurringTransactionId: recurringId,
                createdAt: now,
              })
              .link({ profile: profile.id })
          );

          // If recurring, create recurring transaction record
          if (isRecurring && recurringId) {
            await db.transact(
              db.tx.recurring_transactions[recurringId]
                .update({
                  name: finalRecipient,
                  amount: parsedAmount,
                  recipient: finalRecipient,
                  category: selectedCategory || "Uncategorized",
                  frequency: recurringFrequency,
                  dueDate: new Date(nextDueDate).getTime(),
                  nextDueDate: new Date(nextDueDate).getTime(),
                  lastPaidDate: new Date(date).getTime(),
                  reminderDays: reminderDays ? parseInt(reminderDays) : undefined,
                  isActive: true,
                  isPaused: false,
                  createdAt: now,
                })
                .link({ profile: profile.id })
            );
          }

          toast.success(isRecurring ? "Recurring expense added successfully" : "Expense added successfully");
          break;

        case "income":
          if (!sourceName) {
            toast.error("Please enter a source name");
            setIsSubmitting(false);
            return;
          }
          await db.transact([
            db.tx.income_sources[id()]
              .update({
                name: sourceName,
                amount: parsedAmount,
                frequency: frequency,
                isActive: true,
                paydayDay: 1,
                createdAt: now,
              })
              .link({ profile: profile.id }),
          ]);
          toast.success("Income source added successfully");
          break;

        case "debt":
          if (!debtName) {
            toast.error("Please enter a debt name");
            setIsSubmitting(false);
            return;
          }

          if (debtType === "amortizing" && !monthlyPayment) {
            toast.error("Please enter a monthly payment amount for amortizing loans");
            setIsSubmitting(false);
            return;
          }

          let parsedInterestRate = parseFloat(interestRate || "0");
          
          // Convert interest rate based on calculation type
          if (parsedInterestRate > 0) {
            if (interestCalcType === "monthly") {
              parsedInterestRate = parsedInterestRate * 12;
            }
          }
          
          const hasInterest = parsedInterestRate > 0;

          await db.transact([
            db.tx.debts[id()]
              .update({
                name: debtName,
                totalAmount: parsedAmount,
                currentBalance: parsedAmount,
                debtType,
                interestRate: parsedInterestRate,
                paymentDueDay: hasInterest ? parseInt(paymentDueDay || "1") : 0,
                monthlyPaymentAmount: debtType === "amortizing" ? parseFloat(monthlyPayment || "0") : 0,
                compoundingFrequency: hasInterest ? "monthly" : undefined,
                createdAt: now,
              })
              .link({ profile: profile.id }),
          ]);
          toast.success("Debt added successfully");
          break;

        case "savings":
          if (!savingsName) {
            toast.error("Please enter a goal name");
            setIsSubmitting(false);
            return;
          }
          if (!targetAmount) {
            toast.error("Please enter a target amount");
            setIsSubmitting(false);
            return;
          }

          const goalId = id();
          await db.transact([
            db.tx.savings_goals[goalId]
              .update({
                name: savingsName,
                targetAmount: parseFloat(targetAmount),
                currentAmount: parsedAmount,
                deadline: deadline ? new Date(deadline).getTime() : undefined,
                isCompleted: false,
                createdAt: now,
              })
              .link({ profile: profile.id }),
            // Add initial contribution if amount > 0
            ...(parsedAmount > 0
              ? [
                  db.tx.savings_contributions[id()]
                    .update({
                      amount: parsedAmount,
                      date: now,
                      contributionDate: now,
                      notes: "Initial contribution",
                      createdAt: now,
                    })
                    .link({ goal: goalId }),
                ]
              : []),
          ]);
          toast.success("Savings goal added successfully");
          break;
      }

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding:", error);
      toast.error("Failed to add. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="w-full max-w-md max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking outside if a nested dialog is open
            if (showAddCategoryDialog) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Add New {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(
                v as "expense" | "income" | "debt" | "savings"
              )
            }
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="debt">Debt</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
            </TabsList>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* Common: Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount">
                  {activeTab === "savings"
                    ? "Initial Contribution (KES)"
                    : "Amount (KES)"}
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder={activeTab === "savings" ? "0 (optional)" : "500"}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required={activeTab !== "savings"}
                />
                {activeTab === "savings" && (
                  <p className="text-xs text-muted-foreground">
                    Optional: Leave at 0 to set goal without initial contribution
                  </p>
                )}
              </div>

              {/* EXPENSE TAB */}
              <TabsContent value="expense" className="space-y-4 mt-0">
                {/* Recipient Dropdown */}
                <div className="space-y-2">
                  <Label htmlFor="recipient">Recipient</Label>
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
                              <SelectItem
                                value="__new__"
                                className="font-medium"
                              >
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
                        placeholder="Enter recipient name"
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

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger id="category" className="flex-1">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.name}>
                            <span className="flex items-center gap-2">
                              {cat.icon && <span>{cat.icon}</span>}
                              {cat.name}
                            </span>
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
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>

                {/* Recurring Toggle */}
                <div className="flex items-center justify-between py-2">
                  <Label htmlFor="recurring-toggle" className="text-sm font-medium">
                    Recurring Expense
                  </Label>
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

              {/* INCOME TAB */}
              <TabsContent value="income" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="source-name">Source Name</Label>
                  <Input
                    id="source-name"
                    placeholder="e.g., Salary, Freelance"
                    value={sourceName}
                    onChange={(e) => setSourceName(e.target.value)}
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
                      <SelectItem value="biweekly">Bi-weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="one-time">One-time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              {/* DEBT TAB */}
              <TabsContent value="debt" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="debt-name">Debt Name</Label>
                  <Input
                    id="debt-name"
                    placeholder="e.g., Student Loan, Credit Card"
                    value={debtName}
                    onChange={(e) => setDebtName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="debt-type-modal">Debt Type</Label>
                  <Select value={debtType} onValueChange={(value) => setDebtType(value as DebtType)}>
                    <SelectTrigger id="debt-type-modal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-time">One-Time</SelectItem>
                      <SelectItem value="interest-push">Interest-Push</SelectItem>
                      <SelectItem value="amortizing">Amortizing</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {getDebtTypeDescription(debtType)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="interest-rate"
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={interestRate}
                      onChange={(e) => setInterestRate(e.target.value)}
                      className="flex-1"
                    />
                    <Select value={interestCalcType} onValueChange={(value) => setInterestCalcType(value as "monthly" | "yearly" | "total")}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Per Month</SelectItem>
                        <SelectItem value="yearly">Per Year</SelectItem>
                        <SelectItem value="total">On Total</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter 0 for no interest
                  </p>
                </div>

                {parseFloat(interestRate || "0") > 0 && (
                  <div className="space-y-2">
                    <Label htmlFor="payment-due-day-modal">Payment Due Day (1-31)</Label>
                    <Input
                      id="payment-due-day-modal"
                      type="number"
                      min="1"
                      max="31"
                      placeholder="1"
                      value={paymentDueDay}
                      onChange={(e) => setPaymentDueDay(e.target.value)}
                    />
                  </div>
                )}

                {debtType === "amortizing" && (
                  <div className="space-y-2">
                    <Label htmlFor="monthly-payment">Monthly Payment Amount</Label>
                    <Input
                      id="monthly-payment"
                      type="number"
                      step="0.01"
                      placeholder="5000"
                      value={monthlyPayment}
                      onChange={(e) => setMonthlyPayment(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Amount you&apos;ll pay each month
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* SAVINGS TAB */}
              <TabsContent value="savings" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="savings-name">Goal Name</Label>
                  <Input
                    id="savings-name"
                    placeholder="e.g., Emergency Fund, Vacation"
                    value={savingsName}
                    onChange={(e) => setSavingsName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target-amount">Target Amount (KES)</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    step="0.01"
                    placeholder="100000"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Initial contribution will be recorded if amount is greater
                  than 0
                </p>
              </TabsContent>

              {/* Submit Button */}
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting
                  ? "Adding..."
                  : `Add ${
                      activeTab.charAt(0).toUpperCase() + activeTab.slice(1)
                    }`}
              </Button>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Add Category Dialog */}
      <AddCategoryDialog
        open={showAddCategoryDialog}
        onOpenChange={setShowAddCategoryDialog}
        onCategoryCreated={(categoryId, categoryName) => {
          setSelectedCategory(categoryName);
          setShowAddCategoryDialog(false);
        }}
      />
    </>
  );
}
