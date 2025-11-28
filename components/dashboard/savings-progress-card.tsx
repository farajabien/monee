"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Wallet, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SavingsProgressCardProps {
  monthlySavings: number;
  totalSaved: number;
  totalTarget: number;
  goalsCount: number;
  isLoading?: boolean;
}

export function SavingsProgressCard({
  monthlySavings,
  totalSaved,
  totalTarget,
  goalsCount,
  isLoading = false,
}: SavingsProgressCardProps) {
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const progressPercentage =
    totalTarget > 0 ? Math.min((totalSaved / totalTarget) * 100, 100) : 0;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Savings Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-6 bg-muted rounded w-3/4"></div>
            <div className="h-2 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No savings goals case
  if (goalsCount === 0) {
    return (
      <Card className="h-full bg-muted/30">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Wallet className="h-4 w-4 text-muted-foreground" />
            Savings Progress
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              No savings goals yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start saving for your dreams!
            </p>
          </div>
          <Link href="/dashboard?tab=savings" className="block">
            <Button variant="outline" size="sm" className="w-full">
              Create Savings Goal
              <ArrowRight className="h-3 w-3 ml-2" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Savings Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Monthly Savings */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Saved This Month</div>
          <div className="text-xl font-bold text-blue-600">
            {formatAmount(monthlySavings)}
          </div>
        </div>

        {/* Total Saved with Progress */}
        <div className="space-y-2">
          <div className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Total Saved</div>
              <div className="text-lg font-semibold">
                {formatAmount(totalSaved)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(progressPercentage)}%
              </div>
              <div className="text-xs text-muted-foreground">
                of {formatAmount(totalTarget)}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <Progress value={progressPercentage} className="h-2" />

          {/* Goals Count */}
          <div className="text-xs text-muted-foreground">
            {goalsCount} active goal{goalsCount !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Action Button */}
        <Link href="/dashboard?tab=savings" className="block">
          <Button variant="outline" size="sm" className="w-full">
            Add to Savings
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
