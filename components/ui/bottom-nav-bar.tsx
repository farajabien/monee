import { useState } from "react";
import { Calendar, List, BarChart3, Heart, TrendingUp, MoreHorizontal } from "lucide-react";
import Link from "next/link";

const bottomTabs = [
  { label: "Today", icon: List, href: "/dashboard?tab=daily" },
  { label: "Stats", icon: BarChart3, href: "/dashboard?tab=stats" },
  { label: "Wishlist", icon: Heart, href: "/dashboard?tab=wishlist" },
  { label: "Debts", icon: TrendingUp, href: "/dashboard?tab=debts" },
  { label: "More", icon: MoreHorizontal, href: "/dashboard?tab=more" },
];

export function BottomNavBar({ activeTab }: { activeTab: string }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t flex justify-around items-center h-16 md:hidden">
      {bottomTabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.label.toLowerCase();
        return (
          <Link
            key={tab.label}
            href={tab.href}
            className={`flex flex-col items-center justify-center flex-1 h-full px-1 py-2 transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-6 w-6 mb-1" />
            <span className="text-xs font-medium">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
