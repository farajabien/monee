
"use client";

import { i, useQuery } from "@instantdb/react";
import { AddToSavingsDialog } from "./add-to-savings-dialog";

import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

function DeleteButton({ id }: { id: string }) {
  const handleClick = () => {
    const db = i.db();
    db.transact(i.delete("savings_goals", id))
      .then(() => {
        toast.success("Goal deleted");
      })
      .catch((err) => {
        toast.error("Failed to delete goal:", err.message);
      });
  };
  return <Button variant="destructive" size="sm" onClick={handleClick}>Delete</Button>;
}

export function SavingsGoalList() {
  const { isLoading, error, data } = useQuery(
    i.query("savings_goals", { links: { user: {} } })
  );

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          You haven't set any savings goals yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((goal) => {
        const progress = (goal.currentAmount / goal.targetAmount) * 100;
        return (
          <Card key={goal.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">
                    {goal.emoji} {goal.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Target: KES {goal.targetAmount.toLocaleString()}
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
                    KES {goal.currentAmount.toLocaleString()} / KES{" "}
                    {goal.targetAmount.toLocaleString()}
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
