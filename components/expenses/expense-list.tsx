"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/ui/unified-list-container";
import { EditExpenseDialog } from "./edit-expense-dialog";
import { createExpenseListConfig } from "./expense-list-config";
import type { Expense } from "@/types";

// Wrapper component to adapt props
const EditExpenseDialogAdapter = ({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Expense | null;
}) => {
  return (
    <EditExpenseDialog open={open} onOpenChange={onOpenChange} expense={item} />
  );
};

export default function ExpenseList() {
  const user = db.useUser();

  const { data } = db.useQuery({
    expenses: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
        limit: 50,
      },
    },
    recipients: {
      $: {
        where: { "user.id": user.id },
      },
    },
  });

  const expenses = useMemo(() => data?.expenses || [], [data?.expenses]);
  const recipients = useMemo(() => data?.recipients || [], [data?.recipients]);

  // Create configuration with recipients for display name resolution
  const config = useMemo(
    () => createExpenseListConfig(recipients),
    [recipients]
  );

  return (
    <UnifiedListContainer<Expense>
      config={config}
      data={expenses}
      editDialog={EditExpenseDialogAdapter}
    />
  );
}
