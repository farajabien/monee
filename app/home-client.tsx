"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import db from "@/lib/db";

import CategoryList from "@/components/categories/category-list";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DebtList } from "@/components/debts/debt-list";
import ExpenseList from "@/components/expenses/expense-list";
import { IncomeSourceList } from "@/components/income/income-source-list";
import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";
import SavingsPage from "@/components/savings/savings-page";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const activeTab = searchParams.get("tab") || "overview";
  const moreSubTab = searchParams.get("subtab") || "debts";

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

  // Tab configuration
  const tabs = [
    { value: "overview", label: "Overview" },
    { value: "expenses", label: "Expenses" },
    { value: "income", label: "Income" },
    { value: "more", label: "More" },
  ];

  return (
    <>
      {/* Sticky Tab Navigation */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-40">
        <div className="w-full max-w-2xl mx-auto">
          <div className="grid grid-cols-4 h-auto">
            {tabs.map((tab) => (
              <Link
                key={tab.value}
                href={`/dashboard?tab=${tab.value}`}
                className={
                  `flex items-center justify-center py-3 text-xs sm:text-sm font-medium ` +
                  `border-b-2 transition-colors ` +
                  (activeTab === tab.value
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground")
                }
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-28">
        {activeTab === "overview" && <DashboardOverview />}
        {activeTab === "expenses" && <ExpenseList />}
        {activeTab === "income" && <IncomeSourceList />}
        {activeTab === "more" && (
          <div className="space-y-4">
            {/* Sub-navigation for More section */}
            <div className="flex gap-2 border-b border-border pb-2">
              <Link
                href="/dashboard?tab=more&subtab=debts"
                className={
                  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ` +
                  (moreSubTab === "debts"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted")
                }
              >
                Debts
              </Link>
              <Link
                href="/dashboard?tab=more&subtab=savings"
                className={
                  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ` +
                  (moreSubTab === "savings"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted")
                }
              >
                Savings
              </Link>
              <Link
                href="/dashboard?tab=more&subtab=categories"
                className={
                  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors ` +
                  (moreSubTab === "categories"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted")
                }
              >
                Categories
              </Link>
            </div>

            {/* Sub-tab content */}
            {moreSubTab === "debts" && <DebtList />}
            {moreSubTab === "savings" && <SavingsPage />}
            {moreSubTab === "categories" && <CategoryList />}
          </div>
        )}
      </div>

      <PWABottomNav />
    </>
  );
}
