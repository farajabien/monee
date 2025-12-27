"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import db from "@/lib/db";
import { id } from "@instantdb/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
];

export default function OnboardingFlow() {
  const { user } = db.useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCurrency, setSelectedCurrency] = useState("KES");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);

  const { data, isLoading } = db.useQuery(
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
      if (user && !isLoading && !profile && !isCreatingProfile) {
        setIsCreatingProfile(true);
        try {
          const profileId = id();
          await db.transact(
            db.tx.profiles[profileId]
              .update({
                handle: user.email?.split("@")[0] || "user",
                createdAt: Date.now(),
                onboardingCompleted: false,
                onboardingStep: "currency",
              })
              .link({ user: user.id })
          );
        } catch (error: any) {
          const errorMessage = error?.message || "";
          const isDuplicateError =
            errorMessage.includes("unique attribute") ||
            errorMessage.includes("already exists");
          
          if (isDuplicateError) {
            console.log("Profile already exists, will use existing profile");
          } else {
            console.error("Error creating profile:", error);
          }
        } finally {
          setIsCreatingProfile(false);
        }
      }
    };

    createProfile();
  }, [user, isLoading, profile, isCreatingProfile]);

  // Redirect if onboarding is completed
  useEffect(() => {
    if (profile?.onboardingCompleted) {
      router.push("/dashboard");
    }
  }, [profile, router]);

  if (!user || isLoading || (!profile && isCreatingProfile)) {
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

  if (!isLoading && !profile) {
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

  if (profile?.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const progress = (step / 2) * 100;

  const handleCurrencyNext = async () => {
    if (!profile) return;
    
    const savingToast = toast.loading("Saving currency...");

    try {
      await db.transact(
        db.tx.profiles[profile.id].update({
          currency: selectedCurrency,
          locale: selectedCurrency === "KES" ? "en-KE" : "en-US",
          onboardingStep: "welcome",
        })
      );
      toast.success("Currency saved!", { id: savingToast });
      setStep(2);
    } catch (error) {
      toast.error("Failed to save currency", { id: savingToast });
      console.error(error);
    }
  };

  const handleFinish = async () => {
    if (!profile) return;
    
    const savingToast = toast.loading("Finishing setup...");

    try {
      await db.transact(
        db.tx.profiles[profile.id].update({
          onboardingCompleted: true,
          onboardingStep: "completed",
        })
      );

      toast.success("Welcome to MONEE! 🎉", { id: savingToast });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Failed to complete setup", { id: savingToast });
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 px-4 py-6 sm:py-12">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold">Welcome to MONEE</h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Your Simple Money Tracker
          </p>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step 1: Currency */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Currency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.symbol} {curr.name} ({curr.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleCurrencyNext} className="w-full" size="lg">
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Welcome */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle>You're All Set!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  MONEE helps you track:
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">💰</span>
                    <span><strong>Income</strong> - One-time and recurring</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">🤝</span>
                    <span><strong>Debts</strong> - Who you owe & who owes you</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">💸</span>
                    <span><strong>Expenses</strong> - Daily spending</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">✨</span>
                    <span><strong>ELLIW</strong> - Every Little Thing I Want</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)} 
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleFinish} 
                  className="flex-1" 
                  size="lg"
                >
                  Get Started
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
