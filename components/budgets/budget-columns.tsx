import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import type { BudgetWithRelations } from "@/types"

export const budgetColumns: ColumnDef<BudgetWithRelations>[] = [
  {
    accessorKey: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
    size: 32,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <span className="font-semibold">
        {row.original.category?.name || "Unknown Category"}
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <Badge variant="secondary">
        {new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          minimumFractionDigits: 0,
        }).format(row.original.amount)}
      </Badge>
    ),
  },
  {
    accessorKey: "monthYear",
    header: "Month",
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {new Date(2000, row.original.month - 1).toLocaleString("default", { month: "long" })} {row.original.year}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const budget = row.original as BudgetWithRelations
      const meta = table.options.meta as any
      return (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onEdit && meta.onEdit(budget)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onDelete && meta.onDelete(budget.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    size: 80,
  },
]
