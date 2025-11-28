
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { i } from "@instantdb/react";

const savingsGoalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  targetAmount: z.coerce.number().positive("Target amount must be positive"),
  emoji: z.string().optional(),
});

export function SavingsGoalForm({ profileId }: { profileId: string }) {
  const form = useForm<z.infer<typeof savingsGoalSchema>>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      emoji: "",
    },
  });

  function onSubmit(values: z.infer<typeof savingsGoalSchema>) {
    const db = i.db();
    db.transact(
      i.insert("savings_goals", {
        name: values.name,
        targetAmount: values.targetAmount,
        currentAmount: 0,
        emoji: values.emoji || "💰",
        isCompleted: false,
        createdAt: Date.now(),
        user: { id: profileId },
      })
    )
      .then(() => {
        toast.success("Savings goal created!");
        form.reset();
      })
      .catch((err) => {
        toast.error("Failed to create savings goal: " + err.message);
      });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., New Laptop, Holiday Trip" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="targetAmount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Target Amount (KES)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="50000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="emoji"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Emoji (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="💻" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Add Savings Goal</Button>
      </form>
    </Form>
  );
}
