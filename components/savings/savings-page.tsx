"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SavingsGoalList } from "./savings-goal-list";
import { SavingsAnalytics } from "./savings-analytics";

export default function SavingsPage() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="list">All Goals</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        <TabsContent value="list">
          <SavingsGoalList />
        </TabsContent>
        <TabsContent value="analytics">
          <SavingsAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
