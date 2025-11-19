"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TransactionList from "./components/transactions/transaction-list";
import AddTransactionForm from "./components/transactions/add-transaction-form";
import DailyCheckinCard from "./components/checkin/daily-checkin-card";
import EltiwList from "./components/eltiw/eltiw-list";
import CategoryList from "./components/categories/category-list";
import MonthlySummary from "./components/insights/monthly-summary";
import { BudgetList } from "./components/budgets/budget-list";
import { IncomeSourceList } from "./components/income/income-source-list";
import { IncomeSummary } from "./components/income/income-summary";
import { DebtList } from "./components/debts/debt-list";
import { DebtProgress } from "./components/debts/debt-progress";
import { DebtPaymentForm } from "./components/debts/debt-payment-form";

export default function HomeClient() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <h1 className="text-4xl font-bold">MONEE</h1>
          <p className="text-muted-foreground">
            Your money, finally in one place
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-7 h-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="debts">Debts</TabsTrigger>
            <TabsTrigger value="checkin">Check-In</TabsTrigger>
            <TabsTrigger value="eltiw">ELTIW</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <MonthlySummary />
            <BudgetList />
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

          <TabsContent value="checkin" className="space-y-4">
            <DailyCheckinCard />
          </TabsContent>

          <TabsContent value="eltiw" className="space-y-4">
            <EltiwList />
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <CategoryList />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

