"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IncomeSourceForm } from "./income-source-form";
import { createIncomeSourceListConfig } from "./income-source-list-config";
import type { IncomeSourceWithUser } from "@/types";

export function IncomeSourceList() {
  const user = db.useUser();
  const [showDialog, setShowDialog] = useState(false);
  const [editingIncomeSource, setEditingIncomeSource] =
    useState<IncomeSourceWithUser | null>(null);

  const { data } = db.useQuery({
    income_sources: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
      user: {},
    },
  });

  const incomeSources: IncomeSourceWithUser[] = data?.income_sources || [];

  // Create configuration with edit handler
  const config = useMemo(() => {
    const baseConfig = createIncomeSourceListConfig();
    return {
      ...baseConfig,
      actions: {
        ...baseConfig.actions,
        edit: async (item: IncomeSourceWithUser) => {
          setEditingIncomeSource(item);
          setShowDialog(true);
        },
      },
    };
  }, []);

  return (
    <div className="space-y-4">
      <UnifiedListContainer<IncomeSourceWithUser>
        config={config}
        data={incomeSources}
      />

      {/* Dialog for add/edit income source */}
      <Dialog
        open={showDialog || !!editingIncomeSource}
        onOpenChange={(open) => {
          if (!open) {
            setShowDialog(false);
            setEditingIncomeSource(null);
          }
        }}
      >
        <DialogContent className="w-full max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingIncomeSource ? "Edit Income Source" : "Add Income Source"}
            </DialogTitle>
          </DialogHeader>
          <IncomeSourceForm
            incomeSource={editingIncomeSource}
            onSuccess={() => {
              setShowDialog(false);
              setEditingIncomeSource(null);
            }}
            onCancel={() => {
              setShowDialog(false);
              setEditingIncomeSource(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
