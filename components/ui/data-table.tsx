import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  ColumnDef,
} from "@tanstack/react-table"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DataTablePagination } from "@/components/ui/data-table-pagination"

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
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
    meta: { onEdit, onDelete, onGotIt },
  })

  // Helper to get sticky style

  type StickyMeta = { sticky?: "left" | "right"; className?: string };
  const getStickyStyle = (meta: StickyMeta) => {
    if (!meta?.sticky) return {};
    if (meta.sticky === "left") {
      return {
        position: "sticky" as React.CSSProperties["position"],
        left: 0 as number | string,
        zIndex: 2,
        background: "var(--color-background, #fff)",
      };
    }
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
    <div className="space-y-4">
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta as StickyMeta;
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize(), ...getStickyStyle(meta) }}
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
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta as StickyMeta;
                    return (
                      <TableCell
                        key={cell.id}
                        style={getStickyStyle(meta)}
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
      <DataTablePagination table={table} />
    </div>
  )
}
