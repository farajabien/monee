import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, CheckCircle2, X, Calendar, ExternalLink } from "lucide-react"
import type { EltiwItem } from "@/types"

export const eltiwColumns: ColumnDef<EltiwItem>[] = [
  {
    accessorKey: "index",
    header: "#",
    cell: ({ row }) => row.index + 1,
    size: 32,
  },
  {
    accessorKey: "name",
    header: "Item",
    cell: ({ row }) => (
      <span className={row.original.gotIt ? "line-through" : ""}>
        {row.original.sourceEmoji && <span className="mr-1 text-lg">{row.original.sourceEmoji}</span>}
        {row.original.name}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) =>
      row.original.category ? (
        <Badge variant="outline">{row.original.category.charAt(0).toUpperCase() + row.original.category.slice(1)}</Badge>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      ),
    size: 90,
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => (
      <Badge variant={row.original.gotIt ? "default" : "secondary"}>
        {new Intl.NumberFormat("en-KE", {
          style: "currency",
          currency: "KES",
          minimumFractionDigits: 0,
        }).format(row.original.amount)}
      </Badge>
    ),
  },
  {
    accessorKey: "deadline",
    header: "Deadline",
    cell: ({ row }) =>
      row.original.deadline ? (
        <Badge variant={(() => {
          const diff = row.original.deadline - Date.now();
          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
          if (days < 0) return "destructive";
          if (days <= 3) return "default";
          return "secondary";
        })()}>
          <Calendar className="h-3 w-3 mr-1" />
          {(() => {
            const diff = row.original.deadline - Date.now();
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            if (days < 0) return `Overdue by ${Math.abs(days)}d`;
            if (days === 0) return "Due today";
            if (days === 1) return "Due tomorrow";
            return `Due in ${days}d`;
          })()}
        </Badge>
      ) : null,
  },
  {
    accessorKey: "link",
    header: "Link",
    cell: ({ row }) =>
      row.original.link ? (
        <a
          href={row.original.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit"
        >
          <ExternalLink className="h-3 w-3" />
          View
        </a>
      ) : null,
  },
  {
    accessorKey: "gotIt",
    header: "Status",
    cell: ({ row }) =>
      row.original.gotIt ? (
        <Badge variant="default">Done</Badge>
      ) : (
        <Badge variant="secondary">Active</Badge>
      ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const item = row.original as EltiwItem
      const meta = table.options.meta as any
      return (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onEdit && meta.onEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          {!item.gotIt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => meta?.onGotIt && meta.onGotIt(item)}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Got it!
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => meta?.onDelete && meta.onDelete(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )
    },
    size: 120,
  },
]
