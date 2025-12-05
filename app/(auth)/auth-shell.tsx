"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import db from "@/lib/db";
import EnsureProfile from "@/components/ensure-profile";
import { PaywallDialog } from "@/components/payment/paywall-dialog";
import { DashboardSkeleton } from "@/components/ui/skeleton";

interface AuthShellProps {
  children?: ReactNode;
  className?: string;
}

const FREE_TRIAL_DAYS = 7;

export default function AuthShell({ children, className }: AuthShellProps) {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  // Query the actual $users entity to get payment status
  const { data: usersData, isLoading: isLoadingUsers } = db.useQuery(
    user?.id ? { $users: {} } : {}
  );

  // Query user's profile to check trial eligibility
  const { data: profileData, isLoading: isLoadingProfile } = db.useQuery(
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

  const userRecord = usersData?.$users?.find((u) => u.id === user?.id);
  const profile = profileData?.profiles?.[0];

  // Calculate trial status
  const profileCreatedAt = profile?.createdAt || new Date().getTime();
  const daysSinceCreation = Math.floor(
    (new Date().getTime() - profileCreatedAt) / (1000 * 60 * 60 * 24)
  );
  const isTrialActive = daysSinceCreation < FREE_TRIAL_DAYS;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    // Check payment status after user and payment data loads
    if (
      !isLoading &&
      !isLoadingUsers &&
      !isLoadingProfile &&
      user &&
      userRecord !== undefined
    ) {
      const hasPaid = userRecord?.hasPaid === true;
      // Show paywall if user hasn't paid and trial has expired
      const id = setTimeout(
        () => setShowPaywall(!hasPaid && !isTrialActive),
        0
      );
      return () => clearTimeout(id);
    }
  }, [
    isLoading,
    isLoadingUsers,
    isLoadingProfile,
    user,
    userRecord,
    isTrialActive,
  ]);

  if (isLoading || isLoadingUsers || isLoadingProfile) {
    return (
      <DashboardSkeleton
        title="Authenticating..."
        customContent={
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
          </div>
        }
      />
    );
  }

  if (!user) {
    return null;
  }

  // Allow access if user has paid OR trial is active
  const hasPaid = userRecord?.hasPaid === true;
  const hasAccess = hasPaid || isTrialActive;

  return (
    <>
      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
      {hasAccess ? (
        <EnsureProfile>
          <div className={className}>{children}</div>
        </EnsureProfile>
      ) : (
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <div className="animate-pulse rounded-full h-16 w-16 bg-primary/20 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to MONEE!</h2>
            <p className="text-muted-foreground">
              Your free trial has ended. To continue accessing all features,
              please complete your one-time payment of Ksh 999.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
