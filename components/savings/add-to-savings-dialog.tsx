"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import type { SavingsGoalWithUser, SavingsGoalWithContributions } from "@/types";

const addToSavingsSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
});

type AddToSavingsFormData = z.infer<typeof addToSavingsSchema>;

interface AddToSavingsDialogProps {
  goal: SavingsGoalWithUser | SavingsGoalWithContributions;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddToSavingsDialog({
  goal,
  children,
  open,
  onOpenChange,
}: AddToSavingsDialogProps) {
  const { user } = db.useAuth();
  const form = useForm<AddToSavingsFormData>({
    resolver: zodResolver(addToSavingsSchema),
    defaultValues: { amount: 0 },
  });

  // Fetch profile
  const { data } = db.useQuery({
    profiles: {
      $: {
        where: { "user.id": user?.id || "" },
      },
    },
  });
  const profile = data?.profiles?.[0];

  async function onSubmit(values: AddToSavingsFormData) {
    const { amount } = values;
    const now = new Date().getTime();

    // Calculate next due date for regular savings
    const getNextDueDate = () => {
      if (!goal.isRegular || !goal.frequency) return undefined;
      const date = new Date();
      switch (goal.frequency) {
        case "weekly":
          date.setDate(date.getDate() + 7);
          break;
        case "monthly":
          date.setMonth(date.getMonth() + 1);
          break;
        case "quarterly":
          date.setMonth(date.getMonth() + 3);
          break;
      }
      return date.getTime();
    };

    try {
      await db.transact([
        // Update goal current amount
        tx.savings_goals[goal.id].update({
          currentAmount: goal.currentAmount + amount,
          lastContributionDate: now,
          ...(goal.isRegular ? { nextDueDate: getNextDueDate() } : {}),
        }),
        // Create contribution record
        tx.savings_contributions[crypto.randomUUID()]
          .update({
            amount,
            date: now,
            contributionDate: now,
            notes: `Contribution to ${goal.name}`,
            createdAt: now,
          })
          .link({ goal: goal.id }),
        // Record as expense for cash flow tracking
        ...(profile?.id ? [
          tx.expenses[crypto.randomUUID()]
            .update({
              amount,
              recipient: `Savings: ${goal.name}`,
              date: now,
              category: "Savings",
              rawMessage: "",
              parsedData: {},
              notes: `Contribution to ${goal.name}`,
              createdAt: now,
            })
            .link({ profile: profile.id })
        ] : []),
      ]);

      toast.success(`Added KES ${amount.toLocaleString()} to ${goal.name}`);
      form.reset();
      onOpenChange?.(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      toast.error("Failed to add funds: " + errorMessage);
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
                    <Input
                      type="number"
                      placeholder="1000"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
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
