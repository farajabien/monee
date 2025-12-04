"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import db from "@/lib/db";
import { id } from "@instantdb/react";
import { toast } from "sonner";
import { DEFAULT_CURRENCY, getLocaleForCurrency } from "@/lib/currency-utils";
import { DEFAULT_CATEGORIES } from "@/lib/bootstrap";
import { STEP_CONFIG } from "./config";
import { Step1Currency } from "./step1-currency";
import { Step2Categories } from "./step2-categories";
import { Step3Income } from "./step3-income";
import { Step4Goals } from "./step4-goals";
import { Progress } from "@/components/ui/progress";

export default function OnboardingFlow() {
  const { user } = db.useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  // Step 1: Currency
  const [selectedCurrency, setSelectedCurrency] = useState(DEFAULT_CURRENCY);

  // Step 2: Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customCategories, setCustomCategories] = useState<
    Array<{ name: string; color: string }>
  >([]);

  // Step 3: Income
  const [incomeSources, setIncomeSources] = useState<
    Array<{ name: string; amount: string; frequency: string }>
  >([{ name: "", amount: "", frequency: "monthly" }]);

  // Step 4: Goals
  const [savingsGoals, setSavingsGoals] = useState<
    Array<{ name: string; targetAmount: string }>
  >([]);
  const [debts, setDebts] = useState<
    Array<{ name: string; totalAmount: string }>
  >([]);

  // Fetch profile
  const { data } = db.useQuery(
    user
      ? {
          profiles: {
            $: {
              where: { "user.id": user.id },
            },
          },
        }
      : null
  );

  const profile = data?.profiles?.[0];

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
        } catch (error) {
          console.error("Error creating profile:", error);
        } finally {
          setIsCreatingProfile(false);
        }
      }
    };

    createProfile();
  }, [user, data, profile, isCreatingProfile]);

  // Redirect if onboarding is completed
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [profile, router]);

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-muted-foreground">
            Setting up your profile...
          </p>
        </div>
      </div>
    );
  }

  if (profile.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const progress = (step / STEP_CONFIG.steps.length) * 100;

  // Handlers
  const handleStep1Next = async () => {
    const savingToast = toast.loading("Saving currency...");

    try {
      await db.transact(
        db.tx.profiles[profile.id].update({
          currency: selectedCurrency,
          locale: getLocaleForCurrency(selectedCurrency),
          onboardingStep: "categories",
        })
      );
      toast.success("Currency saved!", { id: savingToast });
      setStep(2);
    } catch (error) {
      toast.error("Failed to save currency", { id: savingToast });
      console.error(error);
    }
  };

  const handleStep2Next = async () => {
    if (selectedCategories.length === 0) {
      toast.error("Please select at least one category");
      return;
    }

    const savingToast = toast.loading("Saving categories...");

    try {
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
          .link({ profile: profile.id });
      });

      await db.transact(txs);
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingStep: "income",
        })
      );

      toast.success("Categories saved!", { id: savingToast });
      setStep(3);
    } catch (error) {
      toast.error("Failed to save categories", { id: savingToast });
      console.error(error);
    }
  };

  const handleStep3Next = async () => {
    const validSources = incomeSources.filter((s) => s.name.trim() && s.amount);

    if (validSources.length > 0) {
      const savingToast = toast.loading("Saving income sources...");

      try {
        const txs = validSources.map((source) => {
          const sourceId = id();
          return db.tx.income_sources[sourceId]
            .update({
              name: source.name,
              amount: parseFloat(source.amount),
              frequency: source.frequency || "monthly",
              isActive: true,
              paydayDay: 1,
              createdAt: Date.now(),
            })
            .link({ profile: profile.id });
        });

        await db.transact(txs);
        toast.success("Income sources saved!", { id: savingToast });
      } catch (error) {
        toast.error("Failed to save income sources", { id: savingToast });
        console.error(error);
      }
    }

    setStep(4);
  };

  const handleFinish = async () => {
    const savingToast = toast.loading("Finishing setup...");

    try {
      // Save savings goals
      const validGoals = savingsGoals.filter(
        (g) => g.name.trim() && g.targetAmount
      );
      if (validGoals.length > 0) {
        const goalTxs = validGoals.map((goal) => {
          const goalId = id();
          return db.tx.savings_goals[goalId]
            .update({
              name: goal.name,
              targetAmount: parseFloat(goal.targetAmount),
              currentAmount: 0,
              isCompleted: false,
              createdAt: Date.now(),
            })
            .link({ profile: profile.id });
        });
        await db.transact(goalTxs);
      }

      // Save debts
      const validDebts = debts.filter((d) => d.name.trim() && d.totalAmount);
      if (validDebts.length > 0) {
        const debtTxs = validDebts.map((debt) => {
          const debtId = id();
          return db.tx.debts[debtId]
            .update({
              name: debt.name,
              totalAmount: parseFloat(debt.totalAmount),
              currentBalance: parseFloat(debt.totalAmount),
              monthlyPaymentAmount: parseFloat(debt.totalAmount) * 0.1,
              paymentDueDay: 1,
              createdAt: Date.now(),
            })
            .link({ profile: profile.id });
        });
        await db.transact(debtTxs);
      }

      // Mark onboarding complete
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingCompleted: true,
          onboardingStep: "completed",
        })
      );

      toast.success("Setup complete! Welcome to MONEE 🎉", { id: savingToast });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to complete setup", { id: savingToast });
      console.error(error);
    }
  };

  const handleSkipToEnd = () => {
    setStep(4);
  };

  const handleUseDefaultCategories = () => {
    setSelectedCategories(DEFAULT_CATEGORIES.map((c) => c.name));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-6 sm:py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-2xl font-bold">Welcome to MONEE</h1>
          <p className="text-base sm:text-sm text-muted-foreground">
            Step {step} of {STEP_CONFIG.steps.length}
          </p>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        {step === 1 && (
          <Step1Currency
            selectedCurrency={selectedCurrency}
            onCurrencyChange={setSelectedCurrency}
            onNext={handleStep1Next}
          />
        )}

        {step === 2 && (
          <Step2Categories
            selectedCategories={selectedCategories}
            customCategories={customCategories}
            onToggleCategory={(name) => {
              setSelectedCategories((prev) =>
                prev.includes(name)
                  ? prev.filter((c) => c !== name)
                  : [...prev, name]
              );
            }}
            onCategoryCreated={(categoryId, name, color) => {
              setCustomCategories((prev) => [...prev, { name, color }]);
              setSelectedCategories((prev) => [...prev, name]);
            }}
            onNext={handleStep2Next}
            onBack={() => setStep(1)}
            onUseDefaults={handleUseDefaultCategories}
          />
        )}

        {step === 3 && (
          <Step3Income
            incomeSources={incomeSources}
            onUpdateSource={(index, field, value) => {
              const updated = [...incomeSources];
              updated[index] = { ...updated[index], [field]: value };
              setIncomeSources(updated);
            }}
            onAddSource={() => {
              setIncomeSources([
                ...incomeSources,
                { name: "", amount: "", frequency: "monthly" },
              ]);
            }}
            onRemoveSource={(index) => {
              setIncomeSources(incomeSources.filter((_, i) => i !== index));
            }}
            onNext={handleStep3Next}
            onBack={() => setStep(2)}
            onSkip={handleSkipToEnd}
          />
        )}

        {step === 4 && (
          <Step4Goals
            savingsGoals={savingsGoals}
            debts={debts}
            onUpdateGoal={(index, field, value) => {
              const updated = [...savingsGoals];
              updated[index] = { ...updated[index], [field]: value };
              setSavingsGoals(updated);
            }}
            onAddGoal={() => {
              setSavingsGoals([
                ...savingsGoals,
                { name: "", targetAmount: "" },
              ]);
            }}
            onRemoveGoal={(index) => {
              setSavingsGoals(savingsGoals.filter((_, i) => i !== index));
            }}
            onUpdateDebt={(index, field, value) => {
              const updated = [...debts];
              updated[index] = { ...updated[index], [field]: value };
              setDebts(updated);
            }}
            onAddDebt={() => {
              setDebts([...debts, { name: "", totalAmount: "" }]);
            }}
            onRemoveDebt={(index) => {
              setDebts(debts.filter((_, i) => i !== index));
            }}
            onFinish={handleFinish}
            onBack={() => setStep(3)}
            onSkip={handleFinish}
          />
        )}
      </div>
    </div>
  );
}
