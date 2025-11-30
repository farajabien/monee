"use client";

import { useState } from "react";
import db from "@/lib/db";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BarChart3, Bell, TrendingUp, Wallet, Cloud, Zap, Shield, Star } from "lucide-react";
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
    { icon: BarChart3, text: "Visual analytics with charts for all modules" },
    { icon: Bell, text: "Smart notifications (daily, debt, payday reminders)" },
    { icon: TrendingUp, text: "Debt tracking with progress visualization" },
    { icon: Wallet, text: "Savings goals with milestone celebrations" },
    { icon: Zap, text: "Quick expense tracking (manual or optional M-Pesa)" },
    { icon: Cloud, text: "Offline-first with cloud sync across devices" },
    { icon: Shield, text: "Cash runway predictions & spending insights" },
    { icon: Star, text: "Lifetime access - no monthly fees ever" },
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
    <Dialog
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
      <DialogContent
        className="max-w-2xl"
        onEscapeKeyDown={(e) => {
          if (!isTrialActive) e.preventDefault();
        }}
        onPointerDownOutside={(e) => {
          if (!isTrialActive) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Image
              src="/AppImages/money-bag.png"
              alt="Money Bag"
              width={24}
              height={24}
            />
            {isTrialActive
              ? "Try MONEE Free for 7 Days"
              : "Unlock Lifetime Access to MONEE"}
          </DialogTitle>
          <DialogDescription>
            {isTrialActive
              ? `${daysRemaining} day${
                  daysRemaining !== 1 ? "s" : ""
                } remaining in your free trial. Upgrade anytime for lifetime access.`
              : "Worth KSh 10,000-15,000. Pay once. Own forever. Best deal ever."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Trial Status Banner */}
          {isTrialActive && (
            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 p-4 rounded-lg border-2 border-green-500">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-700">
                    Free Trial Active
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}{" "}
                    remaining • Full access to all features
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-bold text-primary">
                    Ksh 999
                  </span>
                  <div className="text-left">
                    <span className="text-2xl text-muted-foreground line-through">
                      Ksh 10,000
                    </span>
                    <div className="text-xs text-muted-foreground">
                      True Value
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="mt-2">
                  Limited Lifetime Offer
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-semibold">
              💳 One-time payment • No monthly fees • Lifetime access • Best
              deal ever
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold mb-4 text-center">Everything Included:</h3>
            <div className="grid grid-cols-1 gap-3">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.text}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm leading-relaxed">{feature.text}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 p-3 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-lg border border-green-500/20">
              <p className="text-xs text-center font-semibold">
                🎯 Worth KSh 10,000-15,000 • Pay once, own forever • No monthly fees
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          {isTrialActive ? (
            <>
              <Button
                onClick={handleContinueTrial}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Continue with Free Trial ({daysRemaining} day
                {daysRemaining !== 1 ? "s" : ""} left)
              </Button>
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full"
                size="lg"
              >
                {isProcessing ? "Processing..." : "Upgrade Now - Pay Ksh 999"}
              </Button>
            </>
          ) : (
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? "Processing..." : "Pay Ksh 999 & Get Started"}
            </Button>
          )}
        </DialogFooter>
        <p className="text-xs text-center text-muted-foreground">
          💳 Secure payment via Paystack • Worth KSh 10,000+ • Best deal ever
        </p>
      </DialogContent>
    </Dialog>
  );
}
