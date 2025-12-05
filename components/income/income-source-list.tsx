"use client";

import { useState, useMemo } from "react";
import db from "@/lib/db";
import { UnifiedListContainer } from "@/components/custom/unified-list-container";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TrendingUp } from "lucide-react";
import { IncomeSourceForm } from "./income-source-form";
import { IncomeInsights } from "./income-insights";
import { createIncomeSourceListConfig } from "./income-source-list-config";
import type { IncomeSourceWithUser } from "@/types";
import { useCurrency } from "@/hooks/use-currency";
import { toast } from "sonner";

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
  const incomeSources = useMemo(() => {
    // Add user reference for compatibility with full profile data
    return (profile?.incomeSources || []).map((source) => ({
      ...source,
      profile: profile
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
    })) as IncomeSourceWithUser[];
  }, [profile]);

  const { formatCurrency } = useCurrency(profile?.currency, profile?.locale);

  const handleEdit = (item: IncomeSourceWithUser) => {
    setEditingIncomeSource(item);
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await db.transact(db.tx.income_sources[id].delete());
      toast.success("Income source deleted successfully");
    } catch (error) {
      console.error("Error deleting income source:", error);
      toast.error("Failed to delete income source. Please try again.");
    }
  };

  // Create configuration with edit and delete handlers
  const config = useMemo(() => {
    const baseConfig = createIncomeSourceListConfig(formatCurrency);
    return {
      ...baseConfig,
      actions: {
        ...baseConfig.actions,
        edit: handleEdit,
        delete: handleDelete,
      },
    };
  }, [formatCurrency]);

  return (
    <div className="space-y-4">
      {/* Header with analytics button */}
      <div className="flex items-center justify-end">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <TrendingUp className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Income Analytics</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <IncomeInsights />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
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
