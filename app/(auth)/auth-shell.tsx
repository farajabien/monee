"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import db from "@/lib/db";
import EnsureProfile from "@/components/ensure-profile";
import { PaywallDialog } from "@/components/payment/paywall-dialog";

interface AuthShellProps {
  children?: ReactNode;
  className?: string;
}

export default function AuthShell({ children, className }: AuthShellProps) {
  const router = useRouter();
  const { isLoading, user } = db.useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  // Query the actual $users entity to get payment status
  const { data: usersData, isLoading: isLoadingUsers } = db.useQuery(
    user?.id ? { $users: {} } : {}
  );

  const userRecord = usersData?.$users?.find((u) => u.id === user?.id);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    // Check payment status after user and payment data loads
    if (!isLoading && !isLoadingUsers && user && userRecord !== undefined) {
      const hasPaid = userRecord?.hasPaid === true;
      const id = setTimeout(() => setShowPaywall(!hasPaid), 0);
      return () => clearTimeout(id);
    }
  }, [isLoading, isLoadingUsers, user, userRecord]);

  if (isLoading || isLoadingUsers) {
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

  // Block content if user hasn't paid
  const hasPaid = userRecord?.hasPaid === true;

  return (
    <>
      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
      {hasPaid ? (
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
              To access all features, please complete your one-time payment of
              Ksh 999.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
