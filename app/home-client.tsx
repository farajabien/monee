"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

  // Fetch all data with nested relations for comprehensive tracking
  const { isLoading, error, data } = db.useQuery({
    profiles: {},
    debts: {
      $: {
        where: {
          isActive: true,
        },
      },
      payments: {},
    },
    expenses: {
      recurringTransaction: {},
      profile: {},
    },
    recurring_transactions: {
      $: {
        where: {
          isActive: true,
        },
      },
      linkedExpenses: {},
    },
    recipients: {
      profile: {},
    },
    categories: {
      $: {
        where: {
          isActive: true,
        },
      },
    },
    savings_goals: {
      contributions: {},
    },
    income_sources: {
      $: {
        where: {
          isActive: true,
        },
      },
    },
  });

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
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-6 overflow-x-hidden">
        {activeTab === "overview" && <DashboardOverview />}
        {activeTab === "expenses" && <ExpenseList />}
        {activeTab === "debts" && <DebtList />}
        {activeTab === "income" && <IncomeSourceList />}
        {activeTab === "savings" && <SavingsPage />}
        {activeTab === "categories" && <CategoryList />}
      </div>

      <PWABottomNav />
    </>
  );
}
