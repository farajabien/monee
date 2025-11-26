import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AddExpenseForm from "@/components/expenses/add-expense-form";
import { IncomeSourceForm } from "@/components/income/income-source-form";
import { DebtForm } from "@/components/debts/debt-form";

export function AddExpenseModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState("expense");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[90vh] overflow-y-auto pb-safe p-2"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Add Entry</SheetTitle>
        </SheetHeader>
        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expense">Expense</TabsTrigger>
            <TabsTrigger value="debt">Debt</TabsTrigger>
          </TabsList>
          <TabsContent value="income">
            <IncomeSourceForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
          <TabsContent value="expense">
            <AddExpenseForm />
          </TabsContent>
          <TabsContent value="debt">
            <DebtForm onSuccess={() => onOpenChange(false)} />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
