"use client";

import { useState } from "react";
import db from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Calendar } from "lucide-react";
import { IncomeSourceForm } from "./income-source-form";
import type { IncomeSourceWithUser } from "@/types";

export function IncomeSourceList() {
  const user = db.useUser();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIncomeSource, setEditingIncomeSource] =
    useState<IncomeSourceWithUser | null>(null);

  const { isLoading, error, data } = db.useQuery({
    income_sources: {
      $: {
        where: { "user.id": user.id },
        order: { createdAt: "desc" },
      },
      user: {},
    },
  });

  const incomeSources: IncomeSourceWithUser[] = data?.income_sources || [];

  const handleDelete = (incomeSourceId: string) => {
    if (confirm("Are you sure you want to delete this income source?")) {
      db.transact(db.tx.income_sources[incomeSourceId].delete());
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPayday = (paydayDay: number, paydayMonth?: number) => {
    if (paydayMonth) {
      const monthName = new Date(2000, paydayMonth - 1).toLocaleString("default", {
        month: "long",
      });
      return `${monthName} ${paydayDay}`;
    }
    return `Day ${paydayDay} of each month`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading income sources...</div>
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
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Income Sources</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setEditingIncomeSource(null);
              setShowAddForm(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Income Source
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddForm && (
            <div className="p-4 border rounded-lg">
              <IncomeSourceForm
                onSuccess={() => setShowAddForm(false)}
                onCancel={() => setShowAddForm(false)}
              />
            </div>
          )}

          {editingIncomeSource && (
            <div className="p-4 border rounded-lg">
              <IncomeSourceForm
                incomeSource={editingIncomeSource}
                onSuccess={() => setEditingIncomeSource(null)}
                onCancel={() => setEditingIncomeSource(null)}
              />
            </div>
          )}

          {incomeSources.length === 0 && !showAddForm && !editingIncomeSource ? (
            <div className="text-center text-muted-foreground py-8">
              <p className="mb-2">No income sources added yet.</p>
              <p className="text-sm">Add your income sources to track your earnings.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {incomeSources.map((incomeSource) => (
                <Card key={incomeSource.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{incomeSource.name}</span>
                          <Badge variant="secondary">
                            {formatAmount(incomeSource.amount)}
                          </Badge>
                          {!incomeSource.isActive && (
                            <Badge variant="outline">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {formatPayday(incomeSource.paydayDay, incomeSource.paydayMonth)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowAddForm(false);
                            setEditingIncomeSource(incomeSource);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(incomeSource.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

