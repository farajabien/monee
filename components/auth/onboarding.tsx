"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import db from "@/lib/db";
import { id } from "@instantdb/react";
import { Check, Plus, X } from "lucide-react";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";
import {
  getAllCurrencies,
  DEFAULT_CURRENCY,
  getLocaleForCurrency,
} from "@/lib/currency-utils";
import { DEFAULT_CATEGORIES } from "@/lib/bootstrap";

const EMOJI_OPTIONS = [
  "🎯",
  "💰",
  "🏠",
  "🚗",
  "✈️",
  "📱",
  "💻",
  "🎓",
  "💍",
  "🎉",
  "🏖️",
  "🎮",
  "📚",
  "🎸",
  "⚽",
  "🏋️",
  "🎨",
  "🍕",
  "☕",
  "🌟",
];

export default function Onboarding() {
  const { user } = db.useAuth();
  const { data } = db.useQuery(
    user
      ? {
          profiles: {
            $: {
              where: {
                "user.id": user.id,
              },
            },
          },
        }
      : null
  );

  const profile = data?.profiles?.[0];
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);
  const [customCategories, setCustomCategories] = useState<
    Array<{ name: string; color: string }>
  >([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DEFAULT_CATEGORIES.map((c) => c.name)
  );
  const [incomeSources, setIncomeSources] = useState<
    Array<{
      name: string;
      amount: string;
      paydayDay: string;
      paydayMonth?: string;
      isIrregular: boolean;
    }>
  >([{ name: "", amount: "", paydayDay: "", isIrregular: false }]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    Array<{ name: string; amount: string; category: string }>
  >([]);
  const [debts, setDebts] = useState<
    Array<{
      name: string;
      totalAmount: string;
      currentBalance: string;
      monthlyPaymentAmount: string;
      paymentDueDay: string;
      interestRate: string;
      isOneTimePayment: boolean;
      dueDate?: string;
    }>
  >([]);
  const [savingsGoals, setSavingsGoals] = useState<
    Array<{ name: string; targetAmount: string; emoji: string }>
  >([]);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Create profile if it doesn't exist
  useEffect(() => {
    const createProfile = async () => {
      if (user && data && !profile && !isCreatingProfile) {
        setIsCreatingProfile(true);
        try {
          const profileId = id();
          await db.transact(
            db.tx.profiles[profileId]
              .update({
                handle: user.email?.split("@")[0] || "user",
                monthlyBudget: 0,
                createdAt: Date.now(),
                onboardingCompleted: false,
                onboardingStep: "currency",
              })
              .link({ user: user.id })
          );
          setIsCreatingProfile(false);
        } catch (error) {
          console.error("Error creating profile:", error);
          setIsCreatingProfile(false);
        }
      }
    };

    createProfile();
  }, [user, data, profile, isCreatingProfile]);

  // Redirect to dashboard if onboarding is already completed
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [profile, router]);

  if (!user) return null;

  // Show loading while profile is being created
  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Setting up your profile...
          </p>
        </div>
      </div>
    );
  }

  // Don't render onboarding if already completed
  if (profile.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    );
  }

  const allCategories = [...DEFAULT_CATEGORIES, ...customCategories];

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleCategoryCreated = (
    categoryId: string,
    categoryName: string,
    categoryColor: string
  ) => {
    const newCategory = {
      name: categoryName,
      color: categoryColor,
    };
    setCustomCategories((prev) => [...prev, newCategory]);
    setSelectedCategories((prev) => [...prev, categoryName]);
  };

  const addIncomeSource = () => {
    setIncomeSources([
      ...incomeSources,
      { name: "", amount: "", paydayDay: "", isIrregular: false },
    ]);
  };

  const removeIncomeSource = (index: number) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== index));
  };

  const updateIncomeSource = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const updated = [...incomeSources];
    updated[index] = { ...updated[index], [field]: value };
    setIncomeSources(updated);
  };

  const addRecurringExpense = () => {
    setRecurringExpenses([
      ...recurringExpenses,
      { name: "", amount: "", category: selectedCategories[0] || "Food" },
    ]);
  };

  const removeRecurringExpense = (index: number) => {
    setRecurringExpenses(recurringExpenses.filter((_, i) => i !== index));
  };

  const updateRecurringExpense = (
    index: number,
    field: string,
    value: string
  ) => {
    const updated = [...recurringExpenses];
    updated[index] = { ...updated[index], [field]: value };
    setRecurringExpenses(updated);
  };

  const addDebt = () => {
    setDebts([
      ...debts,
      {
        name: "",
        totalAmount: "",
        currentBalance: "",
        monthlyPaymentAmount: "",
        paymentDueDay: "",
        interestRate: "",
        isOneTimePayment: false,
      },
    ]);
  };

  const removeDebt = (index: number) => {
    setDebts(debts.filter((_, i) => i !== index));
  };

  const updateDebt = (
    index: number,
    field: string,
    value: string | boolean
  ) => {
    const updated = [...debts];
    updated[index] = { ...updated[index], [field]: value };
    setDebts(updated);
  };

  const addSavingsGoal = () => {
    setSavingsGoals([
      ...savingsGoals,
      { name: "", targetAmount: "", emoji: "🎯" },
    ]);
  };

  const removeSavingsGoal = (index: number) => {
    setSavingsGoals(savingsGoals.filter((_, i) => i !== index));
  };

  const updateSavingsGoal = (index: number, field: string, value: string) => {
    const updated = [...savingsGoals];
    updated[index] = { ...updated[index], [field]: value };
    setSavingsGoals(updated);
  };

  const handleNext = async () => {
    setIsSaving(true);
    try {
      if (step === 1) {
        // Save currency preference
        await db.transact(
          db.tx.profiles[profile.id].update({
            currency: selectedCurrency,
            locale: getLocaleForCurrency(selectedCurrency),
            onboardingStep: "categories",
          })
        );

        setStep(2);
      } else if (step === 2) {
        // Validate at least one category is selected
        if (selectedCategories.length === 0) {
          alert("Please select at least one category");
          setIsSaving(false);
          return;
        }

        // Save categories (only default ones, custom ones are already saved via dialog)
        const categoriesToCreate = DEFAULT_CATEGORIES.filter((cat) =>
          selectedCategories.includes(cat.name)
        ).map((cat) => ({
          name: cat.name,
          color: cat.color,
          icon: cat.icon || "",
          isDefault: cat.isDefault || false,
          isActive: true,
          createdAt: Date.now(),
        }));

        const txs = categoriesToCreate.map((cat) => {
          const categoryId = id();
          return db.tx.categories[categoryId]
            .update(cat)
            .link({ user: profile.id });
        });

        if (txs.length > 0) {
          await db.transact(txs);
        }

        // Update onboarding step
        await db.transact(
          db.tx.profiles[profile.id].update({
            onboardingStep: "income",
          })
        );

        setStep(3);
      } else if (step === 3) {
        // Validate at least one income source
        const validIncomeSources = incomeSources.filter(
          (source) => source.name && source.amount
        );

        if (validIncomeSources.length === 0) {
          alert("Please add at least one income source");
          setIsSaving(false);
          return;
        }

        // Save income sources
        const txs = validIncomeSources.map((source) => {
          const incomeId = id();
          return db.tx.income_sources[incomeId]
            .update({
              name: source.name,
              amount: parseFloat(source.amount),
              paydayDay: source.paydayDay ? parseInt(source.paydayDay) : 0,
              paydayMonth: source.paydayMonth
                ? parseInt(source.paydayMonth)
                : undefined,
              isActive: true,
              createdAt: Date.now(),
            })
            .link({ user: profile.id });
        });

        await db.transact(txs);

        // Update onboarding step
        await db.transact(
          db.tx.profiles[profile.id].update({
            onboardingStep: "expenses",
          })
        );

        setStep(4);
      } else if (step === 4) {
        // Save recurring expenses (optional)
        const validRecurringExpenses = recurringExpenses.filter(
          (expense) => expense.name && expense.amount
        );

        if (validRecurringExpenses.length > 0) {
          const txs = validRecurringExpenses.map((expense) => {
            const expenseId = id();
            return db.tx.expenses[expenseId]
              .update({
                amount: parseFloat(expense.amount),
                recipient: expense.name,
                date: Date.now(),
                category: expense.category,
                expenseType: "recurring",
                rawMessage: "",
                parsedData: {},
                createdAt: Date.now(),
              })
              .link({ user: profile.id });
          });

          await db.transact(txs);
        }

        // Update onboarding step
        await db.transact(
          db.tx.profiles[profile.id].update({
            onboardingStep: "debts",
          })
        );

        setStep(5);
      } else if (step === 5) {
        // Save debts (optional)
        const validDebts = debts.filter(
          (debt) => debt.name && debt.totalAmount
        );

        if (validDebts.length > 0) {
          const txs = validDebts.map((debt) => {
            const debtId = id();
            const debtData = {
              name: debt.name,
              totalAmount: parseFloat(debt.totalAmount),
              currentBalance: debt.currentBalance
                ? parseFloat(debt.currentBalance)
                : parseFloat(debt.totalAmount),
              monthlyPaymentAmount: debt.monthlyPaymentAmount
                ? parseFloat(debt.monthlyPaymentAmount)
                : 0,
              paymentDueDay: debt.paymentDueDay
                ? parseInt(debt.paymentDueDay)
                : 1,
              interestRate: debt.interestRate
                ? parseFloat(debt.interestRate)
                : undefined,
              deadline: debt.dueDate
                ? new Date(debt.dueDate).getTime()
                : undefined,
              createdAt: Date.now(),
            };

            // Add deadline for one-time payments
            if (debt.isOneTimePayment && debt.dueDate) {
              debtData.deadline = new Date(debt.dueDate).getTime();
            }

            return db.tx.debts[debtId]
              .update(debtData)
              .link({ user: profile.id });
          });

          await db.transact(txs);
        }

        // Update onboarding step
        await db.transact(
          db.tx.profiles[profile.id].update({
            onboardingStep: "savings",
          })
        );

        setStep(6);
      } else if (step === 6) {
        // Save savings goals (optional)
        const validSavingsGoals = savingsGoals.filter(
          (goal) => goal.name && goal.targetAmount
        );

        if (validSavingsGoals.length > 0) {
          const txs = validSavingsGoals.map((goal) => {
            const goalId = id();
            return db.tx.savings_goals[goalId]
              .update({
                name: goal.name,
                targetAmount: parseFloat(goal.targetAmount),
                currentAmount: 0,
                emoji: goal.emoji || "🎯",
                isCompleted: false,
                createdAt: Date.now(),
              })
              .link({ user: profile.id });
          });

          await db.transact(txs);
        }

        // Mark onboarding as completed
        await db.transact(
          db.tx.profiles[profile.id].update({
            onboardingCompleted: true,
            onboardingStep: "completed",
          })
        );

        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Onboarding save error:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSkip = async () => {
    setIsSaving(true);
    try {
      if (step === 6) {
        // Mark onboarding as completed
        await db.transact(
          db.tx.profiles[profile.id].update({
            onboardingCompleted: true,
            onboardingStep: "completed",
          })
        );
        router.push("/dashboard");
      } else {
        // Update onboarding step when skipping
        let nextStepName = "completed";
        if (step === 1) nextStepName = "categories";
        else if (step === 2) nextStepName = "income";
        else if (step === 3) nextStepName = "expenses";
        else if (step === 4) nextStepName = "debts";
        else if (step === 5) nextStepName = "savings";

        await db.transact(
          db.tx.profiles[profile.id].update({
            onboardingStep: nextStepName,
          })
        );
        setStep(step + 1);
      }
    } catch (error) {
      console.error("Skip error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const canSkipStep = () => {
    // Can't skip currency and categories
    if (step === 1 || step === 2) return false;
    // Can't skip income without at least one source
    if (step === 3) {
      const validIncomeSources = incomeSources.filter(
        (source) => source.name && source.amount
      );
      return validIncomeSources.length > 0;
    }
    // Can skip expenses, debts, and savings
    return true;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5, 6].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-10 rounded-full ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Step {step} of 6
              </span>
            </div>
            <CardTitle>
              {step === 1 && "Choose Your Currency"}
              {step === 2 && "Setup Your Categories"}
              {step === 3 && "Setup Income Sources"}
              {step === 4 && "Setup Recurring Expenses"}
              {step === 5 && "Track Your Debts"}
              {step === 6 && "Set Savings Goals"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <ScrollArea className="h-[500px] pr-4">
              {step === 1 && (
                <>
                  <p className="text-muted-foreground">
                    Select your preferred currency. All amounts will be
                    displayed in this currency.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {getAllCurrencies().map((curr) => (
                      <button
                        key={curr.code}
                        onClick={() => setSelectedCurrency(curr.code)}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          selectedCurrency === curr.code
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/50"
                        }`}
                      >
                        <div className="flex flex-col items-start flex-1">
                          <span className="font-medium text-lg">
                            {curr.symbol} {curr.code}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {curr.name}
                          </span>
                        </div>
                        {selectedCurrency === curr.code && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <p className="text-muted-foreground">
                    Choose the spending categories you want to track. You can
                    customize these later.
                  </p>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {allCategories.map((category) => (
                      <button
                        key={category.name}
                        onClick={() => toggleCategory(category.name)}
                        className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                          selectedCategories.includes(category.name)
                            ? "border-primary bg-primary/5"
                            : "border-muted hover:border-muted-foreground/50"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                        {selectedCategories.includes(category.name) && (
                          <Check className="ml-auto h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAddCategoryDialog(true)}
                    className="w-full mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Custom Category
                  </Button>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="text-muted-foreground">
                    Add your income sources and paydays. This helps us track
                    your money flow. Toggle &quot;Irregular&quot; for income
                    that varies monthly.
                  </p>
                  <div className="space-y-4 mt-6">
                    {incomeSources.map((source, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="space-y-2">
                          <Label>Source Name</Label>
                          <Input
                            placeholder="e.g., Salary, Business"
                            value={source.name}
                            onChange={(e) =>
                              updateIncomeSource(index, "name", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label>Irregular Income</Label>
                          <Switch
                            checked={source.isIrregular}
                            onCheckedChange={(checked) =>
                              updateIncomeSource(index, "isIrregular", checked)
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>
                              {source.isIrregular
                                ? "Estimated Amount"
                                : "Amount"}
                            </Label>
                            <Input
                              type="number"
                              placeholder="50000"
                              value={source.amount}
                              onChange={(e) =>
                                updateIncomeSource(
                                  index,
                                  "amount",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          {!source.isIrregular && (
                            <div className="space-y-2">
                              <Label>Payday</Label>
                              <Input
                                type="number"
                                min="1"
                                max="31"
                                placeholder="25"
                                value={source.paydayDay}
                                onChange={(e) =>
                                  updateIncomeSource(
                                    index,
                                    "paydayDay",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          )}
                        </div>
                        {!source.isIrregular && (
                          <div className="space-y-2">
                            <Label>Month (Optional)</Label>
                            <Select
                              value={source.paydayMonth || "none"}
                              onValueChange={(value) =>
                                updateIncomeSource(
                                  index,
                                  "paydayMonth",
                                  value === "none" ? "" : value
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Recurring monthly" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Recurring monthly
                                </SelectItem>
                                {Array.from(
                                  { length: 12 },
                                  (_, i) => i + 1
                                ).map((m) => (
                                  <SelectItem key={m} value={m.toString()}>
                                    {new Date(2000, m - 1).toLocaleString(
                                      "default",
                                      {
                                        month: "long",
                                      }
                                    )}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {incomeSources.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIncomeSource(index)}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addIncomeSource}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Income Source
                    </Button>
                  </div>
                </>
              )}

              {step === 4 && (
                <>
                  <p className="text-muted-foreground">
                    Add your recurring monthly expenses like rent, bills, and
                    subscriptions. Focus on essentials first.
                  </p>
                  <div className="space-y-4 mt-6">
                    {recurringExpenses.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No recurring expenses added yet
                      </div>
                    ) : (
                      recurringExpenses.map((expense, index) => (
                        <div
                          key={index}
                          className="flex gap-3 items-end p-4 border rounded-lg"
                        >
                          <div className="flex-1 space-y-2">
                            <Label>Expense Name</Label>
                            <Input
                              placeholder="e.g., Rent, WiFi"
                              value={expense.name}
                              onChange={(e) =>
                                updateRecurringExpense(
                                  index,
                                  "name",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label>Amount</Label>
                            <Input
                              type="number"
                              placeholder="5000"
                              value={expense.amount}
                              onChange={(e) =>
                                updateRecurringExpense(
                                  index,
                                  "amount",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label>Category</Label>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={expense.category}
                              onChange={(e) =>
                                updateRecurringExpense(
                                  index,
                                  "category",
                                  e.target.value
                                )
                              }
                            >
                              {selectedCategories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRecurringExpense(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRecurringExpense}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Recurring Expense
                    </Button>
                  </div>
                  {recurringExpenses.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg mt-4">
                      <p className="text-sm font-medium">
                        Estimated Monthly Total
                      </p>
                      <p className="text-2xl font-bold">
                        {selectedCurrency}{" "}
                        {recurringExpenses
                          .reduce(
                            (sum, exp) => sum + (parseFloat(exp.amount) || 0),
                            0
                          )
                          .toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              {step === 5 && (
                <>
                  <p className="text-muted-foreground">
                    Track your debts to stay on top of payments and interest.
                    This is optional but helps with financial planning.
                  </p>
                  <div className="space-y-4 mt-6">
                    {debts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No debts added yet
                      </div>
                    ) : (
                      debts.map((debt, index) => (
                        <div
                          key={index}
                          className="p-4 border rounded-lg space-y-3"
                        >
                          <div className="space-y-2">
                            <Label>Debt Name</Label>
                            <Input
                              placeholder="e.g., Car Loan, Friend Loan"
                              value={debt.name}
                              onChange={(e) =>
                                updateDebt(index, "name", e.target.value)
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>One-time Payment (e.g., friend debt)</Label>
                            <Switch
                              checked={debt.isOneTimePayment}
                              onCheckedChange={(checked) =>
                                updateDebt(index, "isOneTimePayment", checked)
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Total Amount</Label>
                              <Input
                                type="number"
                                placeholder="100000"
                                value={debt.totalAmount}
                                onChange={(e) =>
                                  updateDebt(
                                    index,
                                    "totalAmount",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Current Balance</Label>
                              <Input
                                type="number"
                                placeholder="80000"
                                value={debt.currentBalance}
                                onChange={(e) =>
                                  updateDebt(
                                    index,
                                    "currentBalance",
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>
                          {debt.isOneTimePayment ? (
                            <div className="space-y-2">
                              <Label>Due Date (Optional)</Label>
                              <Input
                                type="date"
                                value={debt.dueDate || ""}
                                onChange={(e) =>
                                  updateDebt(index, "dueDate", e.target.value)
                                }
                              />
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Monthly Payment</Label>
                                <Input
                                  type="number"
                                  placeholder="5000"
                                  value={debt.monthlyPaymentAmount}
                                  onChange={(e) =>
                                    updateDebt(
                                      index,
                                      "monthlyPaymentAmount",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Payment Due Day</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  max="31"
                                  placeholder="15"
                                  value={debt.paymentDueDay}
                                  onChange={(e) =>
                                    updateDebt(
                                      index,
                                      "paymentDueDay",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Interest Rate (%) - Optional</Label>
                            <Input
                              type="number"
                              step="0.1"
                              placeholder="5.5"
                              value={debt.interestRate}
                              onChange={(e) =>
                                updateDebt(
                                  index,
                                  "interestRate",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDebt(index)}
                            className="w-full"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addDebt}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Debt
                    </Button>
                  </div>
                  {debts.length > 0 && (
                    <div className="p-4 bg-muted rounded-lg mt-4">
                      <p className="text-sm font-medium">Total Debt</p>
                      <p className="text-2xl font-bold">
                        {selectedCurrency}{" "}
                        {debts
                          .reduce(
                            (sum, debt) =>
                              sum + (parseFloat(debt.totalAmount) || 0),
                            0
                          )
                          .toLocaleString()}
                      </p>
                    </div>
                  )}
                </>
              )}

              {step === 6 && (
                <>
                  <p className="text-muted-foreground">
                    Set savings goals to work towards. Add items you want to
                    save for.
                  </p>

                  {/* Savings Goals */}
                  <div className="space-y-3 mt-6">
                    <h3 className="font-medium">Savings Goals</h3>
                    {savingsGoals.length === 0 ? (
                      <div className="text-center py-6 text-muted-foreground text-sm">
                        No savings goals added yet
                      </div>
                    ) : (
                      savingsGoals.map((goal, index) => (
                        <div
                          key={index}
                          className="flex gap-3 items-end p-4 border rounded-lg"
                        >
                          <div className="flex-1 space-y-2">
                            <Label>Goal Name</Label>
                            <Input
                              placeholder="e.g., New Phone, Vacation"
                              value={goal.name}
                              onChange={(e) =>
                                updateSavingsGoal(index, "name", e.target.value)
                              }
                            />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label>Target Amount</Label>
                            <Input
                              type="number"
                              placeholder="50000"
                              value={goal.targetAmount}
                              onChange={(e) =>
                                updateSavingsGoal(
                                  index,
                                  "targetAmount",
                                  e.target.value
                                )
                              }
                            />
                          </div>
                          <div className="w-20 space-y-2">
                            <Label>Emoji</Label>
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-full h-10 text-xl"
                                >
                                  {goal.emoji || "🎯"}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-2">
                                <div className="grid grid-cols-5 gap-2">
                                  {EMOJI_OPTIONS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() =>
                                        updateSavingsGoal(index, "emoji", emoji)
                                      }
                                      className="text-2xl hover:bg-muted rounded p-2 transition-colors"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeSavingsGoal(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addSavingsGoal}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Savings Goal
                    </Button>
                  </div>
                </>
              )}
            </ScrollArea>

            <div className="flex gap-3 pt-4">
              {canSkipStep() && (
                <Button
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isSaving}
                  className="flex-1"
                >
                  Skip
                </Button>
              )}
              <Button
                onClick={handleNext}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving
                  ? "Saving..."
                  : step === 6
                  ? "Complete Setup"
                  : "Continue"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AddCategoryDialog
          open={showAddCategoryDialog}
          onOpenChange={setShowAddCategoryDialog}
          onCategoryCreated={handleCategoryCreated}
        />
      </div>
    </div>
  );
}
