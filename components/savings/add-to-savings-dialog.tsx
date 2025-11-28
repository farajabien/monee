
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
import { i } from "@instantdb/react";
import { toast } from "sonner";

const addToSavingsSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});

export function AddToSavingsDialog({ goal, children }: { goal: any; children: React.ReactNode }) {
  const form = useForm<z.infer<typeof addToSavingsSchema>>({
    resolver: zodResolver(addToSavingsSchema),
    defaultValues: { amount: 0 },
  });

  function onSubmit(values: z.infer<typeof addToSavingsSchema>) {
    const db = i.db();
    const { amount } = values;

    db.transact([
      // Update goal current amount
      i.update("savings_goals", goal.id, {
        currentAmount: goal.currentAmount + amount,
      }),
      // Create contribution record
      i.insert("savings_contributions", {
        amount,
        contributionDate: Date.now(),
        notes: `Contribution to ${goal.name}`,
        createdAt: Date.now(),
        goal: { id: goal.id },
      }),
      // Record as expense for cash flow tracking
      i.insert("expenses", {
        amount,
        recipient: `Savings: ${goal.name}`,
        date: Date.now(),
        category: "Savings",
        rawMessage: "",
        parsedData: {},
        notes: `Contribution to ${goal.name}`,
        createdAt: Date.now(),
        user: { id: goal.user.id },
      }),
    ])
      .then(() => {
        toast.success(`Added KES ${amount.toLocaleString()} to ${goal.name}`);
        form.reset();
      })
      .catch((err) => {
        toast.error("Failed to add funds: " + err.message);
      });
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
