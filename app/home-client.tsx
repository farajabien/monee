"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import db from "@/lib/db";

import {
  Plus,
  Calendar,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddSheet } from "@/components/add-sheet";
import { TodayView } from "@/components/today-view";
import { MonthlyView } from "@/components/monthly-view";
import { StatsView } from "@/components/stats-view";


export default function HomeClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const viewMode = searchParams.get("view") || "daily";
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data, isLoading } = db.useQuery({
    profiles: {},
  });

  const profile = data?.profiles?.[0];

  // Get today's date formatted as DD/MM
  const today = new Date();
  const todayFormatted = `${today.getDate().toString().padStart(2, "0")}/${(
    today.getMonth() + 1
  )
    .toString()
    .padStart(2, "0")}`;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Show Monthly view or regular tabs based on viewMode
  const showMonthlyView = viewMode === "monthly";
  const showTodayView = viewMode === "daily" || viewMode === "today";
  const showStatsView = viewMode === "stats";

  return (
    <div className="flex flex-col h-screen">
      {/* App wrapper with max-width */}
      {/* Merged Top Navigation - Daily/Monthly with Month Display */}
      <div className="border-b bg-background shrink-0">
        <div className="flex items-center justify-between px-4 py-3 max-w-lg mx-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Navigate month backward
              const newDate = new Date();
              newDate.setMonth(newDate.getMonth() - 1);
              // This would need state management - for now just placeholder
            }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard?view=daily")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === "daily"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Daily
            </button>

            <span className="text-base font-semibold">
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                year: "numeric",
              })}
            </span>

            <button
              onClick={() => router.push("/dashboard?view=monthly")}
              className={`px-3 py-1.5 text-sm font-medium rounded transition-colors ${
                viewMode === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Monthly
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              // Navigate month forward
            }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto pb-20">
        <div className="max-w-lg mx-auto">
        {showMonthlyView ? (
          <MonthlyView profileId={profile?.id} />
        ) : showStatsView ? (
          <StatsView profileId={profile?.id} />
        ) : (
          <TodayView profileId={profile?.id} />
        )}
        </div>
      </div>

      {/* Bottom Navigation - Money Manager Style */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 pb-safe">
        <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
          {/* Today Tab */}
          <button
            onClick={() => router.push("/dashboard?view=daily")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "daily" || viewMode === "today"
                ? "text-red-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Calendar className="h-5 w-5" />
            <span className="text-xs font-medium">{todayFormatted}</span>
          </button>

          {/* Add Button - Centered & Primary */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-medium transition-colors shadow-lg"
          >
            <Plus className="h-4 w-4" />
            <span className="text-sm">Add</span>
          </button>

          {/* Stats Tab */}
          <button
            onClick={() => router.push("/dashboard?view=stats")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
              viewMode === "stats"
                ? "text-red-500"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BarChart3 className="h-5 w-5" />
            <span className="text-xs font-medium">Stats</span>
          </button>

          {/* Settings Tab */}
          <button
            onClick={() => router.push("/settings")}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors text-zinc-400 hover:text-zinc-200"
          >
            <Settings className="h-5 w-5" />
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </div>

      {/* Add Sheet */}
      <AddSheet
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        profileId={profile?.id}
      />
      

    </div>
  );
}
