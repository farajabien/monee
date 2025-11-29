"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Profile } from "@/types";
import db from "@/lib/db";
import { id } from "@instantdb/react";
import { Check, Plus, X } from "lucide-react";

const DEFAULT_CATEGORIES = [
  { name: "Food", color: "#ef4444", icon: "🍔", isDefault: true },
  { name: "Transport", color: "#f97316", icon: "🚗", isDefault: true },
  { name: "Rent", color: "#8b5cf6", icon: "🏠", isDefault: true },
  { name: "Entertainment", color: "#ec4899", icon: "🎮", isDefault: true },
  { name: "Personal", color: "#06b6d4", icon: "👤", isDefault: true },
  { name: "Shopping", color: "#10b981", icon: "🛍️", isDefault: true },
  { name: "Bills", color: "#3b82f6", icon: "📄", isDefault: true },
  { name: "Misc", color: "#6b7280", icon: "📦", isDefault: true },
];

export default function Onboarding({
  profile,
}: {
  profile: Profile | undefined;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DEFAULT_CATEGORIES.map((c) => c.name)
  );
  const [incomeSources, setIncomeSources] = useState<
    Array<{ name: string; amount: string; paydayDay: string }>
  >([{ name: "", amount: "", paydayDay: "" }]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    Array<{ name: string; amount: string; category: string }>
  >([]);

  if (!profile) return null;

  const toggleCategory = (categoryName: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryName)
        ? prev.filter((c) => c !== categoryName)
        : [...prev, categoryName]
    );
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
      { name: "", amount: "", category: "Bills" },
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
      // Save categories
      const categoriesToCreate = DEFAULT_CATEGORIES.filter((cat) =>
        selectedCategories.includes(cat.name)
      ).map((cat) => ({
        name: cat.name,
        color: cat.color,
        icon: cat.icon,
        isDefault: cat.isDefault,
        isActive: true,
      }));

      await Promise.all(
        categoriesToCreate.map((cat) =>
          db.transact(db.tx.categories[id()].update(cat))
        )
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
                isActive: true,
                createdAt: Date.now(),
              })
              .link({ user: profile.id })
          )
        )
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
        })
      );
      router.push("/dashboard");
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-4">
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
                {DEFAULT_CATEGORIES.map((category) => (
                  <button
                    key={category.name}
                    onClick={() => toggleCategory(category.name)}
                    className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${
                      selectedCategories.includes(category.name)
                        ? "border-primary bg-primary/5"
                        : "border-muted hover:border-muted-foreground/50"
                    }`}
                  >
                    <span className="text-2xl">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                    {selectedCategories.includes(category.name) && (
                      <Check className="ml-auto h-5 w-5 text-primary" />
                    )}
                  </button>
                ))}
              </div>
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
                          updateIncomeSource(index, "paydayDay", e.target.value)
                        }
                      />
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
                  <p className="text-sm font-medium">Estimated Monthly Total</p>
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
    </div>
  );
}
