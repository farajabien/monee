/**
 * DesktopHeader Component
 *
 * Horizontal navigation bar for desktop screens (≥768px)
 * Displays all main navigation items inline with active state indicators
 */

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Home, CreditCard, Coins, TrendingUp, PiggyBank, Tag, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export function DesktopHeader() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";
  const activeSubtab = searchParams.get("subtab");

  const navItems = [
    {
      value: "overview",
      label: "Overview",
      icon: Home,
      href: "/dashboard?tab=overview"
    },
    {
      value: "expenses",
      label: "Expenses",
      icon: CreditCard,
      href: "/dashboard?tab=expenses"
    },
    {
      value: "debts",
      label: "Debts",
      icon: Coins,
      href: "/dashboard?tab=debts"
    },
    {
      value: "income",
      label: "Income",
      icon: TrendingUp,
      href: "/dashboard?tab=income"
    },
    {
      value: "savings",
      label: "Savings",
      icon: PiggyBank,
      href: "/dashboard?tab=more&subtab=savings",
      matchSubtab: "savings"
    },
    {
      value: "categories",
      label: "Categories",
      icon: Tag,
      href: "/dashboard?tab=more&subtab=categories",
      matchSubtab: "categories"
    },
  ];

  const isItemActive = (item: typeof navItems[0]) => {
    if (item.matchSubtab) {
      return activeTab === "more" && activeSubtab === item.matchSubtab;
    }
    return activeTab === item.value;
  };

  return (
    <nav className="hidden md:flex items-center gap-1 px-6 h-[60px] border-b bg-background sticky top-0 z-40">
      <div className="flex items-center gap-1 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(item);

          return (
            <Link
              key={item.value}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-4 h-[60px] border-b-2 transition-colors relative",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <Link
        href="/dashboard?tab=more&subtab=settings"
        className={cn(
          "flex items-center justify-center h-10 w-10 rounded-md transition-colors",
          activeTab === "more" && activeSubtab === "settings"
            ? "bg-accent text-foreground"
            : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
        )}
        title="Settings"
      >
        <Settings className="h-5 w-5" />
      </Link>
    </nav>
  );
}
