"use client";

import { tx } from "@instantdb/react";
import { AddToSavingsDialog } from "./add-to-savings-dialog";
import db from "@/lib/db";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, Target, TrendingUp } from "lucide-react";

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

function MarkCompleteButton({
  goalId,
  currentAmount,
  targetAmount,
}: {
  goalId: string;
  currentAmount: number;
  targetAmount: number;
}) {
  const handleClick = () => {
    if (currentAmount < targetAmount) {
      toast.error("Goal not yet reached. Keep saving!");
      return;
    }
    db.transact(
      tx.savings_goals[goalId].update({
        isCompleted: true,
      })
    )
      .then(() => {
        toast.success("Congratulations! Goal completed! 🎉");
      })
      .catch((err: Error) => {
        toast.error("Failed to mark as complete: " + err.message);
      });
  };
  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      disabled={currentAmount < targetAmount}
    >
      Mark Complete
    </Button>
  );
}

export function SavingsGoalList() {
  const user = db.useUser();

  const { isLoading, error, data } = db.useQuery({
    savings_goals: {
      $: {
        where: {
          "user.id": user.id,
        },
        order: {
          createdAt: "desc",
        },
      },
      contributions: {},
    },
  });

  if (isLoading) return <div className="text-center py-8">Loading...</div>;
  if (error)
    return (
      <div className="text-center py-8 text-red-600">
        Error: {error.message}
      </div>
    );

  const savingsGoals = data?.savings_goals || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-KE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (savingsGoals.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mb-4 text-6xl">💰</div>
        <h3 className="text-lg font-semibold mb-2">No Savings Goals Yet</h3>
        <p className="text-sm text-muted-foreground">
          Create your first savings goal above to start tracking your progress!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {savingsGoals.map((goal) => {
        const progress =
          goal.targetAmount > 0
            ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
            : 0;
        const remaining = goal.targetAmount - goal.currentAmount;
        const isCompleted = goal.isCompleted || goal.currentAmount >= goal.targetAmount;

        return (
          <Card
            key={goal.id}
            className={isCompleted ? "border-green-500 bg-green-50/50 dark:bg-green-950/20" : ""}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-xl">
                      {goal.emoji || "💰"} {goal.name}
                    </CardTitle>
                    {isCompleted && (
                      <Badge variant="default" className="bg-green-600">
                        Completed!
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>Target: {formatCurrency(goal.targetAmount)}</span>
                    </div>
                    {goal.deadline && (
                      <div className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        <span>Due: {formatDate(goal.deadline)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <DeleteButton id={goal.id} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Current vs Target */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">
                      Current Savings
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(goal.currentAmount)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(progress)}%
                    </div>
                    {!isCompleted && (
                      <div className="text-xs text-muted-foreground">
                        {formatCurrency(remaining)} to go
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                <Progress value={progress} className="h-3" />

                {/* Contributions Count */}
                {goal.contributions && goal.contributions.length > 0 && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="h-3 w-3" />
                    <span>
                      {goal.contributions.length} contribution
                      {goal.contributions.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2">
                  {isCompleted ? (
                    <Badge variant="outline" className="text-green-600">
                      Goal Achieved! 🎉
                    </Badge>
                  ) : (
                    <div className="flex gap-2">
                      <AddToSavingsDialog goal={goal}>
                        <Button variant="default" size="sm">
                          Add Money
                        </Button>
                      </AddToSavingsDialog>
                      {progress >= 100 && !goal.isCompleted && (
                        <MarkCompleteButton
                          goalId={goal.id}
                          currentAmount={goal.currentAmount}
                          targetAmount={goal.targetAmount}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
