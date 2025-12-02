"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { IncomeSourceForm } from "./income-source-form";
import { IncomeAnalytics } from "./income-analytics";
import { createIncomeSourceListConfig } from "./income-source-list-config";
import type { IncomeSourceWithUser } from "@/types";
import { useCurrency } from "@/hooks/use-currency";

export function IncomeSourceList() {
  const user = db.useUser();
  const [showDialog, setShowDialog] = useState(false);
  const [editingIncomeSource, setEditingIncomeSource] =
    useState<IncomeSourceWithUser | null>(null);

  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user.id },
      },
      incomeSources: {
        $: {
          order: { createdAt: "desc" },
        },
      },
    },
  });

  const profile = data?.profiles?.[0];
  const incomeSources: IncomeSourceWithUser[] = useMemo(() => {
    // Add user reference for compatibility with full profile data
    return (profile?.incomeSources || []).map((source) => ({
      ...source,
      user: profile
        ? {
            id: profile.id,
            handle: profile.handle,
            monthlyBudget: profile.monthlyBudget,
            createdAt: profile.createdAt,
            onboardingCompleted: profile.onboardingCompleted,
            onboardingStep: profile.onboardingStep,
            currency: profile.currency,
            locale: profile.locale,
          }
        : undefined,
    }));
  }, [profile?.incomeSources, profile]);

  const { formatCurrency } = useCurrency(profile?.currency, profile?.locale);

  // Create configuration with edit handler
  const config = useMemo(() => {
    const baseConfig = createIncomeSourceListConfig(formatCurrency);
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
  }, [formatCurrency]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="list">All Sources</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <UnifiedListContainer<IncomeSourceWithUser>
            config={config}
            data={incomeSources}
          />
        </TabsContent>
        <TabsContent value="analytics">
          <IncomeAnalytics />
        </TabsContent>
      </Tabs>

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
