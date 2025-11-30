"use client";

import { useState } from "react";
import { Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import db from "@/lib/db";
import { PaywallDialog } from "./paywall-dialog";

const FREE_TRIAL_DAYS = 7;

export function TrialCountdownBadge() {
  const { user } = db.useAuth();
  const [showPaywall, setShowPaywall] = useState(false);

  // Query user's profile to check trial status
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
          $users: {},
        }
      : {}
  );

  if (isLoading || !data || !user) return null;

  const profile = data.profiles?.[0];
  const userRecord = data.$users?.find((u) => u.id === user.id);
  const hasPaid = userRecord?.hasPaid === true;

  // If user has paid, don't show trial badge
  if (hasPaid) return null;

  // Calculate trial status
  const profileCreatedAt = profile?.createdAt || Date.now();
  const daysSinceCreation = Math.floor(
    (Date.now() - profileCreatedAt) / (1000 * 60 * 60 * 24)
  );
  const isTrialActive = daysSinceCreation < FREE_TRIAL_DAYS;
  const daysRemaining = Math.max(0, FREE_TRIAL_DAYS - daysSinceCreation);

  // Don't show if trial expired (handled by auth-shell)
  if (!isTrialActive) return null;

  return (
    <>
      <PaywallDialog open={showPaywall} onOpenChange={setShowPaywall} />
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-green-500/30 hover:from-green-500/30 hover:to-blue-500/30 transition-all"
        >
          <Clock className="h-3 w-3 mr-1" />
          {daysRemaining} day{daysRemaining !== 1 ? "s" : ""} left
        </Badge>
        <Button
          size="sm"
          variant="default"
          className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all shadow-sm hidden sm:inline-flex"
          onClick={() => setShowPaywall(true)}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Upgrade
        </Button>
      </div>
    </>
  );
}
