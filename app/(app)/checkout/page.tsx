"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { PaymentButton } from "@/components/payment-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield, ArrowLeft, Zap } from "lucide-react";
import db from "@/lib/db";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  // Fetch user profile
  useEffect(() => {
    const { data, isLoading: loading } = db.useQuery({
      profiles: {},
    });

    setIsLoading(loading);

    if (data?.profiles?.[0]) {
      const userProfile = data.profiles[0];
      setProfile(userProfile);

      // If already paid, redirect to dashboard
      if (userProfile.hasPaid) {
        router.push("/dashboard");
      }
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-lg">Please log in to continue</p>
            <Link href="/login">
              <Button>Go to Login</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

  if (!clientId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <p className="text-lg text-destructive">
              Payment configuration error. Please contact support.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Back button */}
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Main Card */}
        <Card className="border-2 shadow-xl">
          <CardContent className="p-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Image
                  src="/AppImages/money-bag.png"
                  alt="MONEE"
                  width={64}
                  height={64}
                  className="h-16 w-16"
                />
              </div>

              <div className="space-y-2">
                <Badge variant="default" className="text-base px-4 py-1">
                  <Zap className="h-4 w-4 mr-1" />
                  Lifetime Access
                </Badge>
                <h1 className="text-3xl font-bold">Get Monee</h1>
                <p className="text-muted-foreground">
                  Simple money tracker. One-time payment.
                </p>
              </div>

              {/* Price */}
              <div className="py-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-bold text-primary">$10</span>
                  <div className="text-left">
                    <div className="text-sm text-muted-foreground">
                      One-time
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ≈ KSh 1,500
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* What's Included */}
            <div className="space-y-4 py-4 border-t border-b">
              <h3 className="font-semibold text-center">What you get:</h3>
              <div className="grid gap-3">
                {[
                  "Track expenses, income, debts, and wishlist",
                  "Powerful analytics and insights",
                  "Works offline - your data stays private",
                  "Lifetime access - no subscription",
                  "Free updates forever",
                  "Multi-device sync",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* PayPal Button */}
            <div className="space-y-4">
              <PayPalScriptProvider
                options={{
                  clientId: clientId,
                  currency: "USD",
                  intent: "capture",
                }}
              >
                <PaymentButton profileId={profile.id} userId={profile.id} />
              </PayPalScriptProvider>
            </div>

            {/* Trust Badges */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Secure checkout with PayPal</span>
              </div>

              <div className="flex justify-center">
                <Image
                  src="/logos/paypal-logo.png"
                  alt="PayPal"
                  width={120}
                  height={30}
                  className="opacity-60"
                />
              </div>

              <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">
                  7-day money-back guarantee
                </p>
                <p className="text-xs text-muted-foreground">
                  Not working for you? Get a full refund, no questions asked.
                </p>
              </div>
            </div>

            {/* FAQ Hint */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>
                Questions?{" "}
                <Link
                  href="/settings?tab=feedback"
                  className="text-primary hover:underline"
                >
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Alternative */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Want to host it yourself?
          </p>
          <Link
            href="https://github.com/farajabien/monee"
            target="_blank"
            className="text-primary text-sm hover:underline"
          >
            View source code on GitHub →
          </Link>
        </div>
      </div>
    </div>
  );
}
