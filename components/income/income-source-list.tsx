"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/ui/unified-list-container";
import { CardHeader, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEditingIncomeSource(null);
            setShowDialog(true);
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Income
        </Button>
      </CardHeader>

      <CardContent>
        <UnifiedListContainer<IncomeSourceWithUser>
          config={config}
          data={incomeSources}
        />
      </CardContent>

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
