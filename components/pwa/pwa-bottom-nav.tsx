"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Home,
  CreditCard,
  Users,
  TrendingUp,
  MoreHorizontal,
  Settings,
  Tag,
  Wallet,
  X,
  LogOut,
  Repeat,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { db } from "@/lib/instant-client";

export function PWABottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [showMore, setShowMore] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Determine active tab from URL - reactive to changes
  const activeTab = pathname.startsWith("/settings")
    ? "settings"
    : searchParams.get("tab") || "overview";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setShowMore(false);
      }
    };

    if (showMore) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showMore]);

  // Close dropdown when route changes
  useEffect(() => {
    setTimeout(() => {
      setShowMore(false);
    }, 0);
  }, [pathname, searchParams]);

  const handleLogout = () => {
    db.auth.signOut();
    setShowLogoutDialog(false);
    setShowMore(false);
  };

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
      value: "recurring",
      label: "Recurring",
      icon: Repeat,
      href: "/dashboard?tab=recurring",
    },
    {
      value: "categories",
      label: "Categories",
      icon: Tag,
      href: "/dashboard?tab=categories",
    },
    { value: "settings", label: "Settings", icon: Settings, href: "/settings" },
    {
      value: "logout",
      label: "Logout",
      icon: LogOut,
      href: "#",
      onClick: () => setShowLogoutDialog(true),
    },
  ];

  const hasActiveMoreItem = moreItems.some((item) => activeTab === item.value);

  return (
    <>
      {/* Backdrop overlay when More is open */}
      {showMore && (
        <div
          className="fixed inset-0 bg-black/20 z-40 animate-in fade-in duration-200"
          onClick={() => setShowMore(false)}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t pb-safe">
        <div className="max-w-xl mx-auto flex items-center justify-around h-16 relative">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.value;
            return (
              <Link
                key={item.value}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all duration-200 ${
                  isActive
                    ? "text-primary scale-105"
                    : "text-muted-foreground hover:text-foreground active:scale-95"
                }`}
              >
                <Icon
                  className={`h-5 w-5 transition-all ${
                    isActive ? "fill-current" : ""
                  }`}
                />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* More dropdown */}
          <div
            ref={moreRef}
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 relative"
          >
            <button
              className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 ${
                hasActiveMoreItem || showMore
                  ? "text-primary scale-105"
                  : "text-muted-foreground hover:text-foreground active:scale-95"
              }`}
              onClick={() => setShowMore((v) => !v)}
              aria-label="More"
              aria-expanded={showMore}
              type="button"
            >
              {showMore ? (
                <X className="h-5 w-5" />
              ) : (
                <MoreHorizontal
                  className={`h-5 w-5 ${
                    hasActiveMoreItem ? "fill-current" : ""
                  }`}
                />
              )}
              <span className="text-[10px] font-medium">More</span>
            </button>
            {showMore && (
              <div className="absolute bottom-[calc(100%+0.5rem)] left-1/2 -translate-x-1/2 bg-popover border rounded-xl shadow-xl py-2 z-50 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="px-3 py-2 border-b">
                  <p className="text-xs font-semibold text-muted-foreground">
                    More Options
                  </p>
                </div>
                <div className="py-1">
                  {moreItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.value;
                    const isLogout = item.value === "logout";

                    if (isLogout) {
                      return (
                        <button
                          key={item.value}
                          onClick={item.onClick}
                          className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150 w-full text-left ${
                            isActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted text-foreground active:bg-muted/80"
                          }`}
                        >
                          <Icon
                            className={`h-4 w-4 ${
                              isActive ? "fill-current" : ""
                            }`}
                          />
                          <span>{item.label}</span>
                        </button>
                      );
                    }

                    return (
                      <Link
                        key={item.value}
                        href={item.href}
                        className={`flex items-center gap-3 px-4 py-3 text-sm transition-all duration-150 ${
                          isActive
                            ? "bg-primary/10 text-primary font-medium"
                            : "hover:bg-muted text-foreground active:bg-muted/80"
                        }`}
                      >
                        <Icon
                          className={`h-4 w-4 ${
                            isActive ? "fill-current" : ""
                          }`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to logout?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Logout</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
