import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
} from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onEdit?: (row: TData) => void
  onDelete?: (id: string) => void
  onGotIt?: (row: TData) => void
}

export function DataTable<TData, TValue>({ columns, data, onEdit, onDelete, onGotIt }: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    meta: { onEdit, onDelete, onGotIt },
  })

  // Helper to get sticky style
  const getStickyStyle = (meta: any, idx: number, isLast: boolean) => {
    if (!meta?.sticky) return {};
    // left sticky: sum widths of all previous sticky columns
    if (meta.sticky === "left") {
      return {
        position: "sticky" as React.CSSProperties["position"],
        left: 0 as number | string,
        zIndex: 2,
        background: "var(--color-background, #fff)",
      };
    }
    // right sticky: stick to right
    if (meta.sticky === "right") {
      return {
        position: "sticky" as React.CSSProperties["position"],
        right: 0 as number | string,
        zIndex: 2,
        background: "var(--color-background, #fff)",
      };
    }
    return {};
  };

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header, idx) => {
                const meta = header.column.columnDef.meta;
                const isLast = idx === headerGroup.headers.length - 1;
                return (
                  <TableHead
                    key={header.id}
                    style={{ width: header.getSize(), ...getStickyStyle(meta, idx, isLast) }}
                    className={meta?.className || ""}
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map(row => (
              <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                {row.getVisibleCells().map((cell, idx) => {
                  const meta = cell.column.columnDef.meta;
                  const isLast = idx === row.getVisibleCells().length - 1;
                  return (
                    <TableCell
                      key={cell.id}
                      style={getStickyStyle(meta, idx, isLast)}
                      className={meta?.className || ""}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
