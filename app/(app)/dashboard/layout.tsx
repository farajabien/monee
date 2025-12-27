"use client";
import AuthShell from "@/app/(auth)/auth-shell";
import { ReactNode } from "react";
// import { PWABottomNav } from "@/components/pwa/pwa-bottom-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthShell className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 w-full mx-auto px-2 pb-20 pt-2">
        {children}
        {/* <PWABottomNav /> */}
      </main>
    </AuthShell>
  );
}
