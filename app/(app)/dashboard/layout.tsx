"use client";
import AuthShell from "@/app/(auth)/auth-shell";
import { ReactNode, useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FloatingAddButton } from "@/components/custom/floating-add-button";

import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";
import { UnifiedAddModal } from "@/components/quick-add/unified-add-modal";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  const searchParams = useSearchParams();

  // Determine default tab based on current context
  const defaultTab = useMemo(() => {
    const tab = searchParams.get("tab");
    if (tab === "income") return "income";
    if (tab === "debts") return "debt";
    if (tab === "savings") return "savings";
    if (tab === "expenses") return "expense";
    return "expense"; // default fallback
  }, [searchParams]);

  return (
    <AuthShell className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full mx-auto px-2 pb-20 pt-2">
        {children}
        <FloatingAddButton onClick={() => setAddOpen(true)} />
        <UnifiedAddModal
          open={addOpen}
          onOpenChange={setAddOpen}
          defaultTab={defaultTab}
        />
        <PWABottomNav />
      </main>
    </AuthShell>
  );
}
