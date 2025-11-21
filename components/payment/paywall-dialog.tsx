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
import { Check, Sparkles } from "lucide-react";

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "";
const PRICE_KES = 99900; // 999 KES in kobo (smallest currency unit)

export function PaywallDialog({ open, onOpenChange }: PaywallDialogProps) {
  const { user } = db.useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    "M-Pesa Smart Parsing (6+ formats)",
    "Unlimited Transactions",
    "Income & Expense Tracking",
    "Budget Management",
    "Debt Tracking & Payments",
    "ELTIW Wishlist",
    "Daily Check-In Reminders",
    "Monthly Insights",
    "Auto-Categorization",
    "Sync Across Devices",
    "Lifetime Access",
    "Free Updates Forever",
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
        onSuccess: (transaction: { reference: string }) => {
          console.log("Payment successful:", transaction);
          // Update user payment status
          db.transact([
            db.tx.$users[user.id].update({
              hasPaid: true,
              paymentDate: Date.now(),
              paystackReference: transaction.reference,
            }),
          ])
            .then(() => {
              alert("🎉 Payment successful! Welcome to MONEE!");
              onOpenChange(false);
              if (typeof window !== "undefined") {
                window.location.reload(); // Refresh to update UI
              }
            })
            .catch((err) => {
              console.error("Failed to update payment status:", err);
              alert("Payment received but failed to update status. Please contact support.");
            });
        },
        onCancel: () => {
          console.log("Payment cancelled");
          setIsProcessing(false);
        },
      });
    } catch (error) {
      console.error("Payment error:", error);
      alert("Failed to initialize payment. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Unlock Full Access to MONEE
          </DialogTitle>
          <DialogDescription>
            Get lifetime access to all features for a one-time payment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Pricing */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-lg border-2 border-primary">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold">Ksh 999</span>
                  <span className="text-xl text-muted-foreground line-through">
                    Ksh 1,500
                  </span>
                </div>
                <Badge variant="secondary" className="mt-2">
                  33% Launch Discount
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              💳 One-time payment • No subscriptions • Lifetime access
            </p>
          </div>

          {/* Features */}
          <div>
            <h3 className="font-semibold mb-3">Everything Included:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {features.map((feature) => (
                <div key={feature} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Comparison */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Why MONEE vs Excel Templates?</h3>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>✅ Auto-parses M-Pesa messages (no manual entry)</li>
              <li>✅ Smart categorization with recipient matching</li>
              <li>✅ Real-time sync across devices</li>
              <li>✅ No formulas, no manual calculations</li>
              <li>✅ Beautiful insights and progress tracking</li>
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isProcessing}
            className="w-full sm:w-auto"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handlePayment}
            disabled={isProcessing}
            className="w-full sm:w-auto"
            size="lg"
          >
            {isProcessing ? "Processing..." : "Pay Ksh 999 & Get Started"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
