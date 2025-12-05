import { cn } from "@/lib/utils"


// Basic skeleton utility (preserved)
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-accent animate-pulse rounded-md", className)}
      {...props}
    />
  );
}

// DashboardSkeleton: customizable skeleton loader for dashboard pages
import React from "react";

interface DashboardSkeletonProps {
  title?: string;
  children?: React.ReactNode;
  showBottomBar?: boolean;
  customContent?: React.ReactNode;
}

function DashboardSkeleton({
  title = "Loading...",
  children,
  showBottomBar = true,
  customContent,
}: DashboardSkeletonProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* App Header */}
      <header className="px-4 py-3 border-b flex items-center gap-2">
        <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
        <h1 className="text-lg font-semibold text-muted-foreground animate-pulse">
          {title}
        </h1>
      </header>
      {/* Main Skeleton Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {customContent ? (
          customContent
        ) : children ? (
          children
        ) : (
          <div className="w-full max-w-md space-y-4">
            <div className="h-8 w-2/3 bg-muted rounded animate-pulse" />
            <div className="h-6 w-full bg-muted rounded animate-pulse" />
            <div className="h-6 w-5/6 bg-muted rounded animate-pulse" />
            <div className="h-10 w-full bg-muted rounded animate-pulse" />
          </div>
        )}
      </main>
      {/* Bottom Bar Skeleton */}
      {showBottomBar && (
        <footer className="border-t px-4 py-3 flex items-center justify-between bg-background">
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted rounded-full animate-pulse" />
          <div className="h-8 w-24 bg-muted rounded animate-pulse" />
        </footer>
      )}
    </div>
  );
}

export { Skeleton, DashboardSkeleton };
