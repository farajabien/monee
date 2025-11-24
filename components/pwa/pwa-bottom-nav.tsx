"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ArrowLeftRight, Heart, TrendingUp, User } from "lucide-react";

export function PWABottomNav() {
  const pathname = usePathname();
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running in PWA mode - delayed to avoid SSR issues
    const timer = setTimeout(() => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window.navigator as any).standalone === true;
      setIsPWA(isStandalone);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Don't show on marketing pages
  if (!pathname.startsWith("/dashboard") || !isPWA) {
    return null;
  }

  const getTabFromPath = () => {
    const searchParams = new URLSearchParams(window.location.search);
    return searchParams.get("tab") || "overview";
  };

  const activeTab = getTabFromPath();

  const navItems = [
    { value: "overview", label: "Overview", icon: Home },
    { value: "transactions", label: "Money", icon: ArrowLeftRight },
    { value: "eltiw", label: "Wishlist", icon: Heart },
    { value: "income", label: "Income", icon: TrendingUp },
    { value: "year-review", label: "Year", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-safe">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.value;

          return (
            <Link
              key={item.value}
              href={`/dashboard?tab=${item.value}`}
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
      </div>
    </nav>
  );
}
