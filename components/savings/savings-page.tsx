"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { BarChart3 } from "lucide-react";
import { SavingsGoalList } from "./savings-goal-list";
import { SavingsInsights } from "./savings-insights";

export default function SavingsPage() {
  const [analyticsOpen, setAnalyticsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Header with analytics button */}
      <div className="flex items-center justify-end">
        <Sheet open={analyticsOpen} onOpenChange={setAnalyticsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Savings Analytics</SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <SavingsInsights />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main content */}
      <SavingsGoalList />
    </div>
  );
}
