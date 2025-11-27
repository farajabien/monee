
"use client";
import { SavingsGoalForm } from "./savings-goal-form";
import { SavingsGoalList } from "./savings-goal-list";

export default function SavingsPage({ profileId }: { profileId: string }) {
  return (
    <div className="space-y-6">
      <SavingsGoalForm profileId={profileId} />
      <SavingsGoalList />
    </div>
  );
}
