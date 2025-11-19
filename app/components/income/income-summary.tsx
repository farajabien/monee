"use client";

import { useMemo } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { IncomeSourceWithUser } from "@/types";

export function IncomeSummary() {
  const user = db.useUser();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;

  const { isLoading, error, data } = db.useQuery({
    income_sources: {
      $: {
        where: { "user.id": user.id, isActive: true },
      },
      user: {},
    },
  });

  const incomeSources: IncomeSourceWithUser[] = data?.income_sources || [];

  const monthlyIncome = useMemo(() => {
    return (data?.income_sources || []).reduce((total, source) => {
      // If paydayMonth is set, only include if it matches current month
      if (source.paydayMonth && source.paydayMonth !== currentMonth) {
        return total;
      }
      return total + source.amount;
    }, 0);
  }, [data?.income_sources, currentMonth]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading income summary...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-500">Error: {error.message}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Monthly Income -{" "}
          {now.toLocaleString("default", { month: "long", year: "numeric" })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-2xl font-bold">
            {formatAmount(monthlyIncome)}
          </span>
          <Badge variant="default" className="text-lg">
            Total Expected
          </Badge>
        </div>

        {incomeSources.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h3 className="text-sm font-medium">By Source</h3>
            {incomeSources.map((source) => {
              // Skip if paydayMonth is set and doesn't match current month
              if (source.paydayMonth && source.paydayMonth !== currentMonth) {
                return null;
              }
              return (
                <div
                  key={source.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{source.name}</span>
                  <span className="font-medium">
                    {formatAmount(source.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {incomeSources.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Add income sources to see your monthly income summary.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
