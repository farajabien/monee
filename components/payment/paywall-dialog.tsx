"use client";

import { useState } from "react";
import db from "@/lib/db";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  BarChart3,
  Bell,
  TrendingUp,
  Wallet,
  Cloud,
  Zap,
  Shield,
  Star,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PRICE_KES = 99900; // 999 KES in kobo (smallest currency unit)
const FREE_TRIAL_DAYS = 7;

export function PaywallDialog({ open, onOpenChange }: PaywallDialogProps) {
  const { user } = db.useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [hideDialog, setHideDialog] = useState(false);

  // Query user's profile to check trial eligibility
  const { data, isLoading } = db.useQuery(
    user?.id
      ? {
          profiles: {
            $: {
              where: {
                "user.id": user.id,
              },
            },
          },
        }
      : {}
  );

  if (!data || !user) return null;

  const profile = data.profiles?.[0];
  const profileCreatedAt = profile?.createdAt || Date.now();
  const daysSinceCreation = Math.floor(
    (Date.now() - profileCreatedAt) / (1000 * 60 * 60 * 24)
  );
  const isTrialActive = daysSinceCreation < FREE_TRIAL_DAYS;
  const daysRemaining = Math.max(0, FREE_TRIAL_DAYS - daysSinceCreation);

  const features = [
    { icon: BarChart3, text: "Visual analytics with charts" },
    { icon: Bell, text: "Smart notifications & reminders" },
    { icon: TrendingUp, text: "Debt tracking & progress" },
    { icon: Wallet, text: "Savings goals & milestones" },
    { icon: Zap, text: "Quick expense tracking" },
    { icon: Cloud, text: "Cloud sync across devices" },
    { icon: Shield, text: "Cash runway predictions" },
    { icon: Star, text: "Lifetime access forever" },
  ];

  const handlePayment = async () => {
    if (!user?.email) {
      alert("User email not found");
      return;
    }

    if (!PAYSTACK_PUBLIC_KEY) {
      alert("Paystack is not configured. Please add your public key.");
      return;
    }

    setIsProcessing(true);
    setHideDialog(true); // Hide dialog to allow Paystack popup to show

    try {
      // Dynamically import Paystack to avoid SSR issues
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email,
        amount: PRICE_KES,
        currency: "KES",
        ref: `monee_${user.id}_${Date.now()}`,
        metadata: {
          userId: user.id,
          productName: "MONEE Full Access",
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id,
            },
          ],
        },
        onSuccess: (expense: { reference: string }) => {
          console.log("Payment successful:", expense);
          // Update user payment status
          db.transact([
            db.tx.$users[user.id].update({
              hasPaid: true,
              paymentDate: Date.now(),
              paystackReference: expense.reference,
            }),
          ])
            .then(() => {
              toast.success("🎉 Payment successful! Welcome to MONEE!");
              onOpenChange(false);
              // Wait for InstantDB to propagate the change before reloading
              if (typeof window !== "undefined") {
                setTimeout(() => {
                  window.location.reload();
                }, 1500); // Give InstantDB time to sync
              }
            })
            .catch((err) => {
              console.error("Failed to update payment status:", err);
              alert(
                "Payment received but failed to update status. Please contact support."
              );
            });
        },
        onCancel: () => {
          console.log("Payment cancelled");
          setIsProcessing(false);
          setHideDialog(false); // Show dialog again
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initialize payment. Please try again.");
      setIsProcessing(false);
      setHideDialog(false); // Show dialog again
    }
  };

  const handleContinueTrial = () => {
    toast.success(
      `🎉 Enjoy your ${daysRemaining} day${
        daysRemaining !== 1 ? "s" : ""
      } of free trial!`
    );
    onOpenChange(false);
  };

  if (isLoading) {
    return null;
  }

  return (
    <Sheet
      open={open && !hideDialog}
      onOpenChange={(newOpen) => {
        // Allow closing if trial is active
        if (!newOpen && isTrialActive) {
          onOpenChange(false);
          return;
        }
        // Prevent closing if trial expired - user must pay
        if (!newOpen && !isTrialActive) return;
        onOpenChange(newOpen);
      }}
    >
      <SheetContent
        side="bottom"
        className="h-[95vh] flex flex-col"
        onEscapeKeyDown={(e) => {
          if (!isTrialActive) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!isTrialActive) e.preventDefault();
        }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <SheetHeader className="mb-6 sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10 pb-4">
            <SheetTitle className="text-2xl flex items-center gap-2">
              <Image
                src="/AppImages/money-bag.png"
                alt="Money Bag"
                width={24}
                height={24}
              />
              {isTrialActive ? "Try MONEE Free" : "Unlock MONEE"}
            </SheetTitle>
            <SheetDescription>
              {isTrialActive
                ? `${daysRemaining} day${
                    daysRemaining !== 1 ? "s" : ""
                  } remaining in your free trial`
                : "One-time payment. Lifetime access. No monthly fees."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 pb-4">
            {/* Trial Status Banner */}
            {isTrialActive && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                      Free Trial Active
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left •
                      Full access
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Pricing Card */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-6 rounded-xl border-2 border-primary/20">
              <div className="text-center space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold text-primary">
                    Ksh 999
                  </span>
                  <div className="text-left">
                    <span className="text-lg text-muted-foreground line-through">
                      Ksh 10,000
                    </span>
                    <div className="text-xs text-muted-foreground">
                      True Value
                    </div>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-xs font-semibold px-3 py-1"
                >
                  🔥 Limited Lifetime Offer
                </Badge>
                <p className="text-xs text-muted-foreground font-medium">
                  One-time payment • No subscriptions • Own forever
                </p>
              </div>
            </div>

            {/* Features Grid */}
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-center">
                Everything Included
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {features.map((feature) => {
                  const Icon = feature.icon;
                  return (
                    <div
                      key={feature.text}
                      className="flex items-center gap-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">
                        {feature.text}
                      </span>
                      <Check className="h-4 w-4 text-green-600 ml-auto flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Value Proposition */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-xl border border-green-200/50 dark:border-green-800/50">
              <p className="text-xs text-center font-semibold text-foreground">
                🎯 Worth KSh 10,000+ • Best deal ever • No monthly fees
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Footer */}
        <SheetFooter className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t pt-4 pb-safe flex-col gap-3 sm:flex-col">
          {isTrialActive ? (
            <>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full h-12 text-base font-semibold"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Upgrade Now - Ksh 999"}
              </Button>
              <Button
                onClick={handleContinueTrial}
                variant="outline"
                className="w-full h-12 text-base"
                size="lg"
              >
                Continue Trial ({daysRemaining} day
                {daysRemaining !== 1 ? "s" : ""})
              </Button>
            </>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isProcessing ? "Processing..." : "Pay Ksh 999 & Get Started"}
            </Button>
          )}
          <p className="text-xs text-center text-muted-foreground">
            🔒 Secure payment via Paystack • Lifetime access
          </p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
