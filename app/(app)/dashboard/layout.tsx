"use client";
import AuthShell from "@/app/(auth)/auth-shell";
import { ReactNode, useState } from "react";
import { DashboardTopTabs } from "@/components/ui/dashboard-top-tabs";
import { BottomNavBar } from "@/components/ui/bottom-nav-bar";
import { FloatingAddButton } from "@/components/ui/floating-add-button";
import { AddTransactionModal } from "@/components/ui/add-transaction-modal";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	const [addOpen, setAddOpen] = useState(false);
	// Optionally, manage activeTab here if you want to sync with top tabs
	return (
		<AuthShell>
			<div className="flex flex-col min-h-screen bg-background">
				<DashboardTopTabs activeTab={"daily"} onTabChange={() => {}} />
				<main className="flex-1 w-full max-w-3xl mx-auto px-2 pb-20 pt-2">
					{children}
				</main>
				<FloatingAddButton onClick={() => setAddOpen(true)} />
				<AddTransactionModal open={addOpen} onOpenChange={setAddOpen} />
				<BottomNavBar activeTab={"today"} />
			</div>
		</AuthShell>
	);
}
