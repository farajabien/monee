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
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Category, Recipient } from "@/types";

interface UnifiedAddModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "expense" | "income" | "debt" | "savings" | "budget";
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
  const [interestRate, setInterestRate] = useState(""); // Debt
  const [monthlyPayment, setMonthlyPayment] = useState(""); // Debt
  const [savingsName, setSavingsName] = useState(""); // Savings
  const [targetAmount, setTargetAmount] = useState(""); // Savings
  const [deadline, setDeadline] = useState(""); // Savings

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
    setInterestRate("");
    setMonthlyPayment("");
    setSavingsName("");
    setTargetAmount("");
    setDeadline("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!user?.id) {
      toast.error("User not found. Please try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const now = Date.now();
      const parsedAmount = parseFloat(amount);

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
          await db.transact([
            db.tx.expenses[id()]
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
                createdAt: now,
              })
              .link({ user: user.id }),
          ]);
          toast.success("Expense added successfully");
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
              .link({ user: user.id }),
          ]);
          toast.success("Income source added successfully");
          break;

        case "debt":
          if (!debtName) {
            toast.error("Please enter a debt name");
            setIsSubmitting(false);
            return;
          }

          const parsedInterestRate = interestRate
            ? parseFloat(interestRate)
            : 0;
          const parsedMonthlyPayment = monthlyPayment
            ? parseFloat(monthlyPayment)
            : parsedAmount * 0.1;

          await db.transact([
            db.tx.debts[id()]
              .update({
                name: debtName,
                totalAmount: parsedAmount,
                currentBalance: parsedAmount,
                monthlyPaymentAmount: parsedMonthlyPayment,
                interestRate: parsedInterestRate,
                paymentDueDay: 1,
                createdAt: now,
              })
              .link({ user: user.id }),
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
              .link({ user: user.id }),
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

        case "budget":
          if (!selectedCategory) {
            toast.error("Please select a category");
            setIsSubmitting(false);
            return;
          }
          const currentDate = new Date();
          const selectedCategoryObj = categories.find(
            (c) => c.name === selectedCategory
          );

          if (!selectedCategoryObj?.id) {
            toast.error("Category not found");
            setIsSubmitting(false);
            return;
          }

          await db.transact([
            db.tx.budgets[id()]
              .update({
                amount: parsedAmount,
                month: currentDate.getMonth() + 1,
                year: currentDate.getFullYear(),
              })
              .link({ category: selectedCategoryObj.id, user: user.id }),
          ]);
          toast.success("Budget added successfully");
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
            <DialogTitle>Add New</DialogTitle>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={(v) =>
              setActiveTab(
                v as "expense" | "income" | "debt" | "savings" | "budget"
              )
            }
          >
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="expense">Expense</TabsTrigger>
              <TabsTrigger value="income">Income</TabsTrigger>
              <TabsTrigger value="debt">Debt</TabsTrigger>
              <TabsTrigger value="savings">Savings</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
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
                  placeholder="500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
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
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest-rate">Interest Rate (%)</Label>
                  <Input
                    id="interest-rate"
                    type="number"
                    step="0.01"
                    placeholder="5.5"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthly-payment">
                    Monthly Payment (Optional)
                  </Label>
                  <Input
                    id="monthly-payment"
                    type="number"
                    step="0.01"
                    placeholder="Leave blank for 10% of amount"
                    value={monthlyPayment}
                    onChange={(e) => setMonthlyPayment(e.target.value)}
                  />
                </div>
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

              {/* BUDGET TAB */}
              <TabsContent value="budget" className="space-y-4 mt-0">
                <div className="space-y-2">
                  <Label htmlFor="budget-category">Category</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <SelectTrigger id="budget-category" className="flex-1">
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

                <p className="text-xs text-muted-foreground">
                  Budget will be created for{" "}
                  {new Date().toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
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
