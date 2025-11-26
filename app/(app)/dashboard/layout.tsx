"use client";
import AuthShell from "@/app/(auth)/auth-shell";
import { ReactNode, useState } from "react";
import { FloatingAddButton } from "@/components/custom/floating-add-button";
import { AddExpenseModal } from "@/components/expenses/add-expense-modal";
import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);
  // Optionally, manage activeTab here if you want to sync with top tabs
  return (
    <AuthShell className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full max-w-3xl mx-auto px-2 pb-20 pt-2">
        {children}
      </main>
      <FloatingAddButton onClick={() => setAddOpen(true)} />
      <AddExpenseModal open={addOpen} onOpenChange={setAddOpen} />
      <PWABottomNav />
    </AuthShell>
  );
}
