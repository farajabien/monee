"use client";

import { useState } from "react";
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
import DailyCheckinCard from "../components/checkin/daily-checkin-card";
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

const tabs = [
  { value: "overview", label: "Overview" },
  { value: "income", label: "Income" },
  { value: "transactions", label: "Transactions" },
  { value: "debts", label: "Debts" },
  { value: "recipients", label: "Recipients" },
  { value: "categories", label: "Categories" },
];

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="mx-auto max-w-7xl p-2">
      <DashboardHeader />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: Dropdown */}
        <div className="md:hidden mb-4">
          <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue>
                {tabs.find((tab) => tab.value === activeTab)?.label ||
                  "Select tab"}
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
        <TabsList className="hidden md:grid w-full grid-cols-6 h-auto">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <DailyCheckinCard />
          <MonthlySummary />
          <BudgetList />
          <EltiwList />
        </TabsContent>

        <TabsContent value="income" className="space-y-4">
          <IncomeSummary />
          <IncomeSourceList />
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <AddTransactionForm />
          <TransactionList />
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
    </div>
  );
}
