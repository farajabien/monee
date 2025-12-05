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
import { DesktopHeader } from "@/components/navigation/desktop-header";
import SavingsPage from "@/components/savings/savings-page";
import { DashboardSkeleton } from "@/components/ui/skeleton";

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

  if (isLoading) return <DashboardSkeleton title="Loading home..." />;
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
    <>
      {/* Desktop Header Navigation - Hidden on mobile */}
      <DesktopHeader />

      {/* Content */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6 overflow-x-hidden">
        {activeTab === "overview" && <DashboardOverview />}
        {activeTab === "expenses" && <ExpenseList />}
        {activeTab === "debts" && <DebtList />}
        {activeTab === "more" && (
          <div className="space-y-4">
            {/* Sub-navigation for More section */}
            <div className="flex gap-2 border-b border-border pb-2 overflow-x-auto">
              <Link
                href="/dashboard?tab=more&subtab=debts"
                className={
                  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ` +
                  (moreSubTab === "debts"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted")
                }
              >
                Debts
              </Link>
              <Link
                href="/dashboard?tab=more&subtab=income"
                className={
                  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ` +
                  (moreSubTab === "income"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted")
                }
              >
                Income
              </Link>
              <Link
                href="/dashboard?tab=more&subtab=savings"
                className={
                  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ` +
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
                  `px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ` +
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
            {moreSubTab === "income" && <IncomeSourceList />}
            {moreSubTab === "savings" && <SavingsPage />}
            {moreSubTab === "categories" && <CategoryList />}
          </div>
        )}
      </div>

      <PWABottomNav />
    </>
  );
}
