"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ExpenseList from "@/components/expenses/expense-list";
import AddExpenseForm from "@/components/expenses/add-expense-form";
import EltiwList from "@/components/eltiw/eltiw-list";
import CategoryList from "@/components/categories/category-list";
import MonthlySummary from "@/components/insights/monthly-summary";
import { BudgetList } from "@/components/budgets/budget-list";
import { IncomeSourceList } from "@/components/income/income-source-list";
import { DebtList } from "@/components/debts/debt-list";
import { DebtProgress } from "@/components/debts/debt-progress";
import { RecipientList } from "@/components/recipients/recipient-list";
import { YearInReview } from "@/components/insights/year-in-review";
import { EltiwWidget } from "@/components/eltiw/eltiw-widget";
import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "overview";
  const [overviewTab, setOverviewTab] = useState("summary");
  // Use URL param as source of truth for active tab
  const activeTab = tabFromUrl;

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6 pb-20 md:pb-0">
      {/* Main content is now controlled by URL param only; navigation is via bottom bar or header links */}
      {activeTab === "overview" && (
        <Tabs
          value={overviewTab}
          onValueChange={setOverviewTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          </TabsList>
          <TabsContent value="summary" className="mt-4">
            <MonthlySummary />
          </TabsContent>
          <TabsContent value="budgets" className="mt-4">
            <BudgetList />
          </TabsContent>
          <TabsContent value="wishlist" className="mt-4">
            <EltiwWidget />
          </TabsContent>
        </Tabs>
      )}
      {activeTab === "year-review" && <YearInReview />}
      {activeTab === "income" && (
        <>
          <IncomeSourceList />
        </>
      )}
      {activeTab === "expenses" && (
        <Tabs defaultValue="list" className="w-full">
          <TabsList className="mb-2">
            <TabsTrigger value="list">Expenses List</TabsTrigger>
            <TabsTrigger value="add">Add Expense</TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <ExpenseList />
          </TabsContent>
          <TabsContent value="add">
            <AddExpenseForm />
          </TabsContent>
        </Tabs>
      )}
      {activeTab === "eltiw" && <EltiwList />}
      {activeTab === "debts" && (
        <>
          <DebtProgress />
          <DebtList />
        </>
      )}
      {activeTab === "recipients" && <RecipientList />}
      {activeTab === "categories" && <CategoryList />}
      <PWABottomNav />
    </div>
  );
}
