"use client";

import { LayoutGrid, Table } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewModeToggleProps {
  viewMode: "card" | "table";
  onViewModeChange: (mode: "card" | "table") => void;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 rounded-lg border p-1">
      <Button
        variant={viewMode === "card" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("card")}
        className="h-7 px-2"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Cards</span>
      </Button>
      <Button
        variant={viewMode === "table" ? "secondary" : "ghost"}
        size="sm"
        onClick={() => onViewModeChange("table")}
        className="h-7 px-2"
      >
        <Table className="h-4 w-4" />
        <span className="ml-1 hidden sm:inline">Table</span>
      </Button>
    </div>
  );
}
