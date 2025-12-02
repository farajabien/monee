"use client";

import { RecurringExpenseList } from "@/components/recurring/recurring-expense-list";
import db from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { ManualExpenseDialog } from "@/components/expenses/manual-expense-dialog";

export default function RecurringExpensesPage() {
  const { user } = db.useAuth();
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Fetch profile
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id || "" },
      },
    },
  });

  const profile = data?.profiles?.[0];

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recurring Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your regular payments and subscriptions
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 How it works
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Click &quot;Mark as Paid&quot; to record a payment instantly</li>
          <li>• Next due date updates automatically</li>
          <li>• Pause subscriptions you&apos;re temporarily not using</li>
          <li>• Edit anytime to update amounts or frequencies</li>
        </ul>
      </div>

      {/* Recurring Expenses List */}
      <RecurringExpenseList profileId={profile.id} />

      {/* Add Expense Dialog */}
      <ManualExpenseDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </div>
  );
}
