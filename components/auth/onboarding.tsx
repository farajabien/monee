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
import db from "@/lib/db";
import { id } from "@instantdb/react";
import { Check, Plus, X } from "lucide-react";
import { AddCategoryDialog } from "@/components/categories/add-category-dialog";

const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#f97316" },
  { name: "Transport", color: "#3b82f6" },
  { name: "Housing", color: "#8b5cf6" },
  { name: "Utilities", color: "#06b6d4" },
  { name: "Savings", color: "#22c55e" },
  { name: "Misc", color: "#a3a3a3" },
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
    }>
  >([{ name: "", amount: "", paydayDay: "" }]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    Array<{ name: string; amount: string; category: string }>
  >([]);
  const [showAddCategoryDialog, setShowAddCategoryDialog] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

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
                onboardingStep: "categories",
              })
              .link({ user: user.id })
          );
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

  const handleCategoryCreated = (categoryId: string, categoryName: string) => {
    // Find the color from the custom category that was just created
    // Since we don't have direct access to it, we'll use a default color
    const newCategory = {
      name: categoryName,
      color: "#3b82f6", // Default color, will be overridden by actual color from dialog
    };
    setCustomCategories((prev) => [...prev, newCategory]);
    setSelectedCategories((prev) => [...prev, categoryName]);
  };

  const addIncomeSource = () => {
    setIncomeSources([
      ...incomeSources,
      { name: "", amount: "", paydayDay: "" },
    ]);
  };

  const removeIncomeSource = (index: number) => {
    setIncomeSources(incomeSources.filter((_, i) => i !== index));
  };

  const updateIncomeSource = (index: number, field: string, value: string) => {
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

  const handleNext = async () => {
    if (step === 1) {
      // Save categories (only default ones, custom ones are already saved via dialog)
      const categoriesToCreate = DEFAULT_CATEGORIES.filter((cat) =>
        selectedCategories.includes(cat.name)
      ).map((cat) => ({
        name: cat.name,
        color: cat.color,
        icon: "",
        isActive: true,
        createdAt: Date.now(),
      }));

      await Promise.all(
        categoriesToCreate.map((cat) =>
          db.transact(
            db.tx.categories[id()].update(cat).link({ user: profile.id })
          )
        )
      );

      // Update onboarding step
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingStep: "income",
        })
      );

      setStep(2);
    } else if (step === 2) {
      // Save income sources
      const validIncomeSources = incomeSources.filter(
        (source) => source.name && source.amount && source.paydayDay
      );

      await Promise.all(
        validIncomeSources.map((source) =>
          db.transact(
            db.tx.income_sources[id()]
              .update({
                name: source.name,
                amount: parseFloat(source.amount),
                paydayDay: parseInt(source.paydayDay),
                paydayMonth: source.paydayMonth
                  ? parseInt(source.paydayMonth)
                  : undefined,
                isActive: true,
                createdAt: Date.now(),
              })
              .link({ user: profile.id })
          )
        )
      );

      // Update onboarding step
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingStep: "expenses",
        })
      );

      setStep(3);
    } else if (step === 3) {
      // Save recurring expenses
      const validRecurringExpenses = recurringExpenses.filter(
        (expense) => expense.name && expense.amount
      );

      await Promise.all(
        validRecurringExpenses.map((expense) =>
          db.transact(
            db.tx.expenses[id()]
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
              .link({ user: profile.id })
          )
        )
      );

      // Mark onboarding as completed
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingCompleted: true,
          onboardingStep: "completed",
        })
      );

      router.push("/dashboard");
    }
  };

  const handleSkip = async () => {
    if (step === 3) {
      // Mark onboarding as completed even if skipping recurring expenses
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingCompleted: true,
          onboardingStep: "completed",
        })
      );
      router.push("/dashboard");
    } else {
      // Update onboarding step when skipping
      const nextStepName = step === 1 ? "income" : "expenses";
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingStep: nextStepName,
        })
      );
      setStep(step + 1);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/20 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-2 w-16 rounded-full ${
                      s <= step ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                Step {step} of 3
              </span>
            </div>
            <CardTitle>
              {step === 1 && "Setup Your Categories"}
              {step === 2 && "Setup Income Sources"}
              {step === 3 && "Setup Recurring Expenses"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 1 && (
              <>
                <p className="text-muted-foreground">
                  Choose the spending categories you want to track. You can
                  customize these later.
                </p>
                <div className="grid grid-cols-2 gap-3">
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
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Custom Category
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="text-muted-foreground">
                  Add your income sources and paydays. This helps us track your
                  money flow.
                </p>
                <div className="space-y-4">
                  {incomeSources.map((source, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-end p-4 border rounded-lg"
                    >
                      <div className="flex-1 space-y-2">
                        <Label>Source Name</Label>
                        <Input
                          placeholder="e.g., Salary, Business"
                          value={source.name}
                          onChange={(e) =>
                            updateIncomeSource(index, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label>Amount (KES)</Label>
                        <Input
                          type="number"
                          placeholder="50000"
                          value={source.amount}
                          onChange={(e) =>
                            updateIncomeSource(index, "amount", e.target.value)
                          }
                        />
                      </div>
                      <div className="w-24 space-y-2">
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
                      <div className="flex-1 space-y-2">
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
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(
                              (m) => (
                                <SelectItem key={m} value={m.toString()}>
                                  {new Date(2000, m - 1).toLocaleString(
                                    "default",
                                    {
                                      month: "long",
                                    }
                                  )}
                                </SelectItem>
                              )
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      {incomeSources.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeIncomeSource(index)}
                        >
                          <X className="h-4 w-4" />
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

            {step === 3 && (
              <>
                <p className="text-muted-foreground">
                  Add your recurring monthly expenses like rent, bills, and
                  subscriptions.
                </p>
                <div className="space-y-4">
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
                          <Label>Amount (KES)</Label>
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
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      Estimated Monthly Total
                    </p>
                    <p className="text-2xl font-bold">
                      KES{" "}
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

            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleSkip} className="flex-1">
                Skip
              </Button>
              <Button onClick={handleNext} className="flex-1">
                {step === 3 ? "Complete Setup" : "Continue"}
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
