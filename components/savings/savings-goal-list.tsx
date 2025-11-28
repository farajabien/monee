"use client";

import { tx, id } from "@instantdb/react";
import { AddToSavingsDialog } from "./add-to-savings-dialog";
import db from "@/lib/db";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function DeleteButton({ id: goalId }: { id: string }) {
  const handleClick = () => {
    db.transact(tx.savings_goals[goalId].delete())
      .then(() => {
        toast.success("Goal deleted");
      })
      .catch((err: Error) => {
        toast.error("Failed to delete goal: " + err.message);
      });
  };
  return (
    <Button variant="destructive" size="sm" onClick={handleClick}>
      Delete
    </Button>
  );
}

interface SavingsGoal {
  id: string;
  name: string;
  emoji: string;
  targetAmount: number;
  currentAmount: number;
}

export function SavingsGoalList() {
  const { isLoading, error, data } = db.useQuery({
    eltiw_items: {
      $: {
        where: {
          source: "savings",
        },
      },
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const savingsGoals = data?.eltiw_items || [];

  return (
    <div className="space-y-4">
      {savingsGoals.map((goal) => {
        const progress = goal.gotIt ? 100 : 0;
        return (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {goal.sourceEmoji || "💰"} {goal.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target: KES {goal.amount.toLocaleString()}
                  </p>
                </div>
                <DeleteButton id={goal.id} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="flex items-center justify-between pt-2">
                  <p className="text-sm font-medium">
                    {goal.gotIt ? "Completed! 🎉" : "In Progress"}
                  </p>
                  <AddToSavingsDialog goal={goal}>
                    <Button variant="outline" size="sm">
                      Add Money
                    </Button>
                  </AddToSavingsDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
