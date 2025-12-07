import * as React from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, RefreshCw, Calendar } from "lucide-react";
import type { Expense } from "@/types";

export const expenseColumns: ColumnDef<Expense, unknown>[] = [
  {
    accessorKey: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
    size: 32,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <span className="font-semibold">
        {new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          minimumFractionDigits: 0,
        }).format(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) =>
      row.original.category ? (
        <Badge variant="secondary">{row.original.category}</Badge>
      ) : null,
  },
  {
    accessorKey: "recipient",
    header: "Recipient",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <span>{row.original.recipient || "-"}</span>
        {row.original.isRecurring && (
          <RefreshCw className="h-3 w-3 text-muted-foreground" />
        )}
      </div>
    ),
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) =>
      new Date(row.original.date || row.original.createdAt).toLocaleDateString(
        "en-KE",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      ),
  },
  {
    accessorKey: "paidThisMonth",
    header: "Paid",
    cell: ({ row }) => {
      if (!row.original.isRecurring) return null;
      return (
        <Badge variant={row.original.paidThisMonth ? "default" : "outline"}>
          {row.original.paidThisMonth ? "Yes" : "No"}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const expense = row.original as Expense;
      const meta = table.options.meta as {
        onEdit?: (t: Expense) => void;
        onDelete?: (id: string) => void;
      };
      return (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onEdit && meta.onEdit(expense)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onDelete && meta.onDelete(expense.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
    size: 80,
  },
];
