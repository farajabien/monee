"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import db from "@/lib/db";

import CategoryList from "@/components/categories/category-list";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DebtList } from "@/components/debts/debt-list";
import AddExpenseForm from "@/components/expenses/add-expense-form";
import ExpenseList from "@/components/expenses/expense-list";
import { IncomeSourceList } from "@/components/income/income-source-list";
import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";
import SavingsPage from "@/components/savings/savings-page";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UnifiedAddModal } from "@/components/quick-add/unified-add-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabFromUrl = searchParams.get("tab") || "overview";
  const activeTab = tabFromUrl;
  const [showAddModal, setShowAddModal] = useState(false);

  const { isLoading, error, data } = db.useQuery({ profiles: {} });

  const profile = data?.profiles?.[0];

  // Check onboarding status and redirect if incomplete
  useEffect(() => {
    if (!isLoading && profile) {
      if (!profile.onboardingCompleted) {
        router.push("/onboarding");
      }
    }
  }, [isLoading, profile, router]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>No profile found</div>;

  // Don't render content if onboarding is incomplete (will redirect)
  if (!profile.onboardingCompleted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-3 sm:p-4 md:p-6 pb-20 md:pb-0">
      {activeTab === "overview" && (
        <div className="space-y-6">
          <DashboardOverview />
        </div>
      )}
      {activeTab === "income" && <IncomeSourceList />}
      {activeTab === "expenses" && (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="list">All Expenses</TabsTrigger>
            <TabsTrigger value="import">Import SMS/PDF</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <ExpenseList />
          </TabsContent>
          <TabsContent value="import">
            <AddExpenseForm />
          </TabsContent>
        </Tabs>
      )}
      {activeTab === "debts" && <DebtList />}
      {activeTab === "savings" && <SavingsPage />}
      {activeTab === "categories" && <CategoryList />}

      {/* Floating Add Button - only show on list tabs */}
      {activeTab !== "overview" && (
        <Button
          size="lg"
          className="fixed bottom-20 right-4 md:right-6 h-14 w-14 rounded-full shadow-lg z-40"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}

      {/* Unified Add Modal */}
      <UnifiedAddModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        defaultTab={
          activeTab === "expenses"
            ? "expense"
            : activeTab === "income"
            ? "income"
            : activeTab === "debts"
            ? "debt"
            : activeTab === "savings"
            ? "savings"
            : "expense"
        }
      />

      <PWABottomNav />
    </div>
  );
}
