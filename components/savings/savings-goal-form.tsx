"use client";

import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { tx } from "@instantdb/react";
import db from "@/lib/db";

const savingsGoalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  targetAmount: z.number().positive("Target amount must be positive"),
  emoji: z.string().optional(),
});

type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

interface SavingsGoalFormProps {
  profileId: string;
  onSuccess?: () => void;
  asDialog?: boolean; // If true, renders with dialog wrapper (default true)
}

export function SavingsGoalForm({
  profileId,
  onSuccess,
  asDialog = true,
}: SavingsGoalFormProps) {
  const [open, setOpen] = useState(false);
  const form = useForm<SavingsGoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      emoji: "",
    },
  });

  async function onSubmit(values: SavingsGoalFormData) {
    try {
      const createdAt = new Date().getTime();
      await db.transact(
        tx.savings_goals[crypto.randomUUID()]
          .update({
            name: values.name,
            targetAmount: values.targetAmount,
            currentAmount: 0,
            emoji: values.emoji || "💰",
            isCompleted: false,
            createdAt,
          })
          .link({ user: profileId })
      );

      toast.success("Savings goal created!");
      form.reset();
      if (asDialog) {
        setOpen(false);
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error("Failed to create savings goal: " + errorMessage);
    }
  }

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Goal Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., New Laptop, Holiday Trip"
                  {...field}
                />
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
                <Input
                  type="number"
                  placeholder="50000"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                />
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
        <Button type="submit" className="w-full">
          Add Savings Goal
        </Button>
      </form>
    </Form>
  );

  // Render as plain form when asDialog is false (for )
  if (!asDialog) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">New Savings Goal</h3>
          <p className="text-sm text-muted-foreground">
            Create a new savings goal to track your progress
          </p>
        </div>
        {formContent}
      </div>
    );
  }

  // Render with dialog wrapper (for SavingsPage)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Savings Goal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Savings Goal</DialogTitle>
          <DialogDescription>
            Create a new savings goal to track your progress
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
