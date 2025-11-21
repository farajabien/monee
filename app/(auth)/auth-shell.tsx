"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import db from "@/lib/db";
import EnsureProfile from "@/components/ensure-profile";
import HomeClient from "@/app/home-client";
import { PaywallDialog } from "@/components/payment/paywall-dialog";

export default function AuthShell() {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    // Check payment status after user loads
    if (!isLoading && user) {
      // @ts-expect-error - hasPaid is added to user schema but types not yet updated
      const hasPaid = user.hasPaid === true;
      if (!hasPaid) {
        setShowPaywall(true);
      }
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
      <EnsureProfile>
        <HomeClient />
      </EnsureProfile>
    </>
  );
}

