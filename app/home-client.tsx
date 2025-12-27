"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import db from "@/lib/db";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

// Placeholder components - we'll create these next
function IncomeList() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Income</h2>
        <p className="text-sm text-muted-foreground">MRR: KSh 0</p>
      </div>
      <div className="text-center py-8 text-muted-foreground">
        No income recorded yet
      </div>
    </div>
  );
}

function DebtsList() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Debts</h2>
        <p className="text-sm text-muted-foreground">Total to Pay: KSh 0</p>
      </div>
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">People I Owe</h3>
          <div className="text-center py-4 text-muted-foreground text-sm">
            No debts to pay
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium mb-2">People Who Owe Me</h3>
          <div className="text-center py-4 text-muted-foreground text-sm">
            No debts to collect
          </div>
        </div>
      </div>
    </div>
  );
}

function ExpensesList() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Expenses</h2>
        <p className="text-sm text-muted-foreground">Total Spent: KSh 0</p>
      </div>
      <div className="text-center py-8 text-muted-foreground">
        No expenses recorded yet
      </div>
    </div>
  );
}

function WishlistList() {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">ELLIW</h2>
        <p className="text-sm text-muted-foreground">Every Little Thing I Want</p>
      </div>
      <div className="text-center py-8 text-muted-foreground">
        No wishlist items yet
      </div>
    </div>
  );
}

export default function HomeClient() {
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") || "income";
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data, isLoading } = db.useQuery({
    profiles: {},
  });

  const profile = data?.profiles?.[0];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Main content area */}
      <div className="flex-1 overflow-auto pb-20">
        <Tabs defaultValue={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 sticky top-0 z-10 bg-background">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="debts">Debts</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="elliw">ELLIW</TabsTrigger>
          </TabsList>

          <TabsContent value="income" className="mt-0">
            <IncomeList />
          </TabsContent>

          <TabsContent value="debts" className="mt-0">
            <DebtsList />
          </TabsContent>

          <TabsContent value="expenses" className="mt-0">
            <ExpensesList />
          </TabsContent>

          <TabsContent value="elliw" className="mt-0">
            <WishlistList />
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="grid grid-cols-3 gap-2 p-4 max-w-5xl mx-auto">
          <Button variant="outline" className="w-full">
            <Calendar className="h-4 w-4 mr-2" />
            Today
          </Button>
          <Button
            className="w-full"
            onClick={() => setShowAddDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
          <Button variant="outline" className="w-full">
            TBD
          </Button>
        </div>
      </div>
    </div>
  );
}
