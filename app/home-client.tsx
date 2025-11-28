"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ensureDefaultCategories } from "@/lib/bootstrap";
import db from "@/lib/db";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { BudgetList } from "@/components/budgets/budget-list";
import CategoryList from "@/components/categories/category-list";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DebtList } from "@/components/debts/debt-list";
import { DebtProgress } from "@/components/debts/debt-progress";
import AddExpenseForm from "@/components/expenses/add-expense-form";
import ExpenseList from "@/components/expenses/expense-list";
import { IncomeSourceList } from "@/components/income/income-source-list";
import MonthlySummary from "@/components/insights/monthly-summary";
import { YearInReview } from "@/components/insights/year-in-review";
import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";
import { RecipientList } from "@/components/recipients/recipient-list";
import SavingsPage from "@/components/savings/savings-page";

// Helper component for consistent tab content styling
const TabContentShell = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-4">
    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    {children}
  </div>
);

export default function HomeClient() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "overview";
  const [overviewTab, setOverviewTab] = useState("summary");
  const activeTab = tabFromUrl;

  const { isLoading, error, data } = db.useQuery({ profiles: {} });

  const profile = data?.profiles?.[0];

  useEffect(() => {
    if (profile && profile.id) {
      ensureDefaultCategories(db, profile.id);
    }
  }, [profile]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!profile) return <div>No profile found</div>;

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6 pb-20 md:pb-0">
      {activeTab === "overview" && (
        <div className="space-y-6">
          <DashboardOverview />
          {/* Optional: Show tabs for detailed views */}
          <Tabs
            value={overviewTab}
            onValueChange={setOverviewTab}
            className="w-full pt-6"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="summary">Detailed Summary</TabsTrigger>
              <TabsTrigger value="budgets">Budgets</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-4">
              <MonthlySummary />
            </TabsContent>
            <TabsContent value="budgets" className="mt-4">
              <BudgetList />
            </TabsContent>
          </Tabs>
        </div>
      )}
      {activeTab === "year-review" && (
        <TabContentShell title="Year in Review">
          <YearInReview />
        </TabContentShell>
      )}
      {activeTab === "income" && (
        <TabContentShell title="Income">
          <IncomeSourceList />
        </TabContentShell>
      )}
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
      {activeTab === "debts" && (
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-2">
            <TabsTrigger value="list">All Debts</TabsTrigger>
            <TabsTrigger value="progress">Debt Progress</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <DebtList />
          </TabsContent>
          <TabsContent value="progress">
            <DebtProgress />
          </TabsContent>
        </Tabs>
      )}
      {activeTab === "savings" && (
        <TabContentShell title="Savings">
          <SavingsPage profileId={profile.id} />
        </TabContentShell>
      )}
      {activeTab === "recipients" && (
        <TabContentShell title="Recipients">
          <RecipientList />
        </TabContentShell>
      )}
      {activeTab === "categories" && (
        <TabContentShell title="Categories">
          <CategoryList />
        </TabContentShell>
      )}
      <PWABottomNav />
    </div>
  );
}
