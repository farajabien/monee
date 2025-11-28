
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { tx } from "@instantdb/react";
import db from "@/lib/db";
import { toast } from "sonner";

const addToSavingsSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

type AddToSavingsFormData = {
  amount: number;
};

export function AddToSavingsDialog({
  goal,
  children,
  open,
  onOpenChange
}: {
  goal: any;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const form = useForm<AddToSavingsFormData>({
    resolver: zodResolver(addToSavingsSchema) as any,
    defaultValues: { amount: 0 },
  });

  async function onSubmit(values: AddToSavingsFormData) {
    const { amount } = values;

    try {
      await db.transact([
        // Update goal current amount
        tx.savings_goals[goal.id].update({
          currentAmount: goal.currentAmount + amount,
        }),
        // Create contribution record
        tx.savings_contributions[crypto.randomUUID()].update({
          amount,
          contributionDate: Date.now(),
          notes: `Contribution to ${goal.name}`,
          createdAt: Date.now(),
        }).link({ goal: goal.id }),
        // Record as expense for cash flow tracking
        tx.expenses[crypto.randomUUID()].update({
          amount,
          recipient: `Savings: ${goal.name}`,
          date: Date.now(),
          category: "Savings",
          rawMessage: "",
          parsedData: {},
          notes: `Contribution to ${goal.name}`,
          createdAt: Date.now(),
        }).link({ user: goal.user.id }),
      ]);

      toast.success(`Added KES ${amount.toLocaleString()} to ${goal.name}`);
      form.reset();
    } catch (err: any) {
      toast.error("Failed to add funds: " + err.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add to {goal.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Add (KES)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="1000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Contribute</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
