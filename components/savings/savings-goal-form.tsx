"use client";

import { useState, useEffect } from "react";
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
import type { SavingsGoalWithContributions } from "@/types";

const savingsGoalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  targetAmount: z.number().positive("Target amount must be positive"),
  emoji: z.string().optional(),
});

type SavingsGoalFormData = z.infer<typeof savingsGoalSchema>;

interface SavingsGoalFormProps {
  profileId?: string;
  goal?: SavingsGoalWithContributions; // Optional - if provided, form is in edit mode
  onSuccess?: () => void;
  asDialog?: boolean; // If true, renders with dialog wrapper (default true)
}

export function SavingsGoalForm({
  profileId,
  goal,
  onSuccess,
  asDialog = true,
}: SavingsGoalFormProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!goal;

  const form = useForm<SavingsGoalFormData>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues: {
      name: goal?.name || "",
      targetAmount: goal?.targetAmount || 0,
      emoji: goal?.emoji || "",
    },
  });

  // Update form when goal changes (for edit mode)
  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        targetAmount: goal.targetAmount,
        emoji: goal.emoji || "",
      });
    }
  }, [goal, form]);

  async function onSubmit(values: SavingsGoalFormData) {
    try {
      if (isEditMode && goal) {
        // Update existing goal
        await db.transact(
          tx.savings_goals[goal.id].update({
            name: values.name,
            targetAmount: values.targetAmount,
            emoji: values.emoji || "💰",
          })
        );
        toast.success("Savings goal updated!");
      } else {
        // Create new goal
        if (!profileId) {
          toast.error("Profile ID is required to create a goal");
          return;
        }
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
            .link({ profile: profileId })
        );
        toast.success("Savings goal created!");
      }

      form.reset();
      if (asDialog) {
        setOpen(false);
      }
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      toast.error(
        isEditMode
          ? "Failed to update savings goal: " + errorMessage
          : "Failed to create savings goal: " + errorMessage
      );
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
          {isEditMode ? "Update Savings Goal" : "Add Savings Goal"}
        </Button>
      </form>
    </Form>
  );

  // Render as plain form when asDialog is false (for )
  if (!asDialog) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">
            {isEditMode ? "Edit Savings Goal" : "New Savings Goal"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isEditMode
              ? "Update your savings goal details"
              : "Create a new savings goal to track your progress"}
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
          <DialogTitle>
            {isEditMode ? "Edit Savings Goal" : "Add Savings Goal"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update your savings goal details"
              : "Create a new savings goal to track your progress"}
          </DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
