"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CreditCard,
  Users,
  TrendingUp,
  MoreHorizontal,
  Settings,
  Tag,
  Wallet,
  Calendar,
} from "lucide-react";

export function PWABottomNav() {
  const pathname = usePathname();
  // React hooks must be called unconditionally
  const [showMore, setShowMore] = useState(false);
  // Determine active tab from URL
  const getTabFromPath = () => {
    if (pathname.startsWith("/settings")) return "settings";
    const searchParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    return searchParams.get("tab") || "overview";
  };
  const activeTab = getTabFromPath();

  // Main nav items (always visible) - 4 most frequent features for 1-tap access
  const navItems = [
    {
      value: "overview",
      label: "Overview",
      icon: Home,
      href: "/dashboard?tab=overview",
    },
    {
      value: "expenses",
      label: "Expenses",
      icon: CreditCard,
      href: "/dashboard?tab=expenses",
    },
    {
      value: "recipients",
      label: "Recipients",
      icon: Users,
      href: "/dashboard?tab=recipients",
    },
    {
      value: "debts",
      label: "Debts",
      icon: CreditCard,
      href: "/dashboard?tab=debts",
    },
  ];

  // Extra nav items (in More dropdown) - less frequently used features
  const moreItems = [
    {
      value: "savings",
      label: "Savings",
      icon: Wallet,
      href: "/dashboard?tab=savings",
    },
    {
      value: "income",
      label: "Income",
      icon: TrendingUp,
      href: "/dashboard?tab=income",
    },
    {
      value: "categories",
      label: "Categories",
      icon: Tag,
      href: "/dashboard?tab=categories",
    },
    {
      value: "year-review",
      label: "Year Review",
      icon: Calendar,
      href: "/dashboard?tab=year-review",
    },
    { value: "settings", label: "Settings", icon: Settings, href: "/settings" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-safe">
      <div className="max-w-xl mx-auto flex items-center justify-around h-16 relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;
          return (
            <Link
              key={item.value}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "fill-current" : ""}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        {/* More dropdown */}
        <div className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative">
          <button
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              moreItems.some((item) => activeTab === item.value)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setShowMore((v) => !v)}
            aria-label="More"
            type="button"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
          {showMore && (
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-popover border rounded-lg shadow-lg py-2 px-3 z-50 min-w-[120px] animate-in fade-in">
              {moreItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.value}
                    href={item.href}
                    className={`flex items-center gap-2 px-2 py-2 rounded-md text-sm transition-colors ${
                      activeTab === item.value
                        ? "bg-muted text-primary"
                        : "hover:bg-muted text-foreground"
                    }`}
                    onClick={() => setShowMore(false)}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
