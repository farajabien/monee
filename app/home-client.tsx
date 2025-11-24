"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TransactionList from "../components/transactions/transaction-list";
import AddTransactionForm from "../components/transactions/add-transaction-form";
import EltiwList from "../components/eltiw/eltiw-list";
import CategoryList from "../components/categories/category-list";
import MonthlySummary from "../components/insights/monthly-summary";
import { BudgetList } from "../components/budgets/budget-list";
import { IncomeSourceList } from "../components/income/income-source-list";
import { IncomeSummary } from "../components/income/income-summary";
import { DebtList } from "../components/debts/debt-list";
import { DebtProgress } from "../components/debts/debt-progress";
import { DashboardHeader } from "../components/header/dashboard-header";
import { RecipientList } from "../components/recipients/recipient-list";
import { YearInReview } from "../components/insights/year-in-review";
import { QuickAddFab } from "../components/eltiw/quick-add-fab";
import { EltiwWidget } from "../components/eltiw/eltiw-widget";
import { PWABottomNav } from "../components/pwa/pwa-bottom-nav";

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "year-review", label: "2025 Review" },
  { value: "income", label: "Income" },
  { value: "transactions", label: "Transactions" },
  { value: "eltiw", label: "ELTIW" },
  { value: "debts", label: "Debts" },
  { value: "recipients", label: "Recipients" },
  { value: "categories", label: "Categories" },
];

export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab") || "overview";
  const [overviewTab, setOverviewTab] = useState("summary");
  
  // Use URL param as source of truth for active tab
  const activeTab = tabFromUrl;
  
  const handleTabChange = (value: string) => {
    router.push(`/dashboard?tab=${value}`);
  };

  return (
    <div className="mx-auto max-w-7xl p-3 sm:p-4 md:p-6">
      <DashboardHeader />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        {/* Mobile: Show ELTIW and Transactions tabs + Dropdown for others */}
        <div className="md:hidden mb-4 flex gap-2">
          <TabsList className="grid grid-cols-2 flex-1">
            <TabsTrigger value="eltiw">ELTIW</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue>
                {tabs.find((tab) => tab.value === activeTab)?.label ||
                  "More"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.value} value={tab.value}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Desktop: Tabs */}
        <TabsList className="hidden md:grid w-full grid-cols-8 h-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Tabs value={overviewTab} onValueChange={setOverviewTab} className="w-full">
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
        </TabsContent>

        <TabsContent value="year-review" className="space-y-4">
          <YearInReview />
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <IncomeSummary />
          <IncomeSourceList />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="mb-2">
              <TabsTrigger value="list">Transactions List</TabsTrigger>
              <TabsTrigger value="add">Add Transaction</TabsTrigger>
            </TabsList>
            <TabsContent value="list">
              <TransactionList />
            </TabsContent>
            <TabsContent value="add">
              <AddTransactionForm />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="eltiw" className="space-y-4">
          <EltiwList />
        </TabsContent>

        <TabsContent value="debts" className="space-y-4">
          <DebtProgress />
          <DebtList />
        </TabsContent>

        <TabsContent value="recipients" className="space-y-4">
          <RecipientList />
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <CategoryList />
        </TabsContent>
      </Tabs>
      <QuickAddFab />
      <PWABottomNav />
      {/* Add bottom padding when PWA nav is visible */}
      <div className="h-20 md:h-0" />
    </div>
  );
}
